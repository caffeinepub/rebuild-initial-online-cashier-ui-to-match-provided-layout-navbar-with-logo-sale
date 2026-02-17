import Map "mo:core/Map";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import List "mo:core/List";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type Product = {
    id : Nat;
    name : Text;
    size : Text;
    category : Text;
    salePrice : Nat;
    hpp : Nat;
    image : Storage.ExternalBlob;
  };

  type InventoryItem = {
    id : Nat;
    itemName : Text;
    category : Text;
    size : Text;
    unit : Text;
    initialStock : Nat;
    reject : Nat;
    finalStock : Nat;
    minimumStock : Nat;
  };

  type PaymentMethod = {
    #dana;
    #qris;
    #tunai;
    #trf;
  };

  type SaleItem = {
    productId : Nat;
    quantity : Nat;
    unitPrice : Nat;
    cogs : Nat;
    productName : Text;
  };

  type SaleRecord = {
    amount : Nat;
    id : Nat;
    items : [SaleItem];
    paymentMethod : PaymentMethod;
    timestamp : Time.Time;
    totalQuantity : Nat;
    totalTax : Nat;
  };

  type DashboardSummary = {
    todayRevenue : Nat;
    totalQuantitySold : Nat;
    paymentMethodTotals : PaymentMethodTotals;
  };

  type PaymentMethodTotals = {
    dana : Nat;
    qris : Nat;
    tunai : Nat;
    trf : Nat;
  };

  type QontohStockRule = {
    productCategory : Text;
    productSize : Text;
    inventoryCategory : Text;
    inventorySize : Text;
  };

  type TransactionType = {
    #income;
    #expense;
  };

  type CashTransaction = {
    id : Nat;
    amount : Nat;
    transactionType : TransactionType;
    description : Text;
    timestamp : Time.Time;
  };

  public type InventoryReportEntry = {
    timestamp : Time.Time;
    itemName : Text;
    itemSize : Text;
    quantity : Nat;
    description : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  let products = Map.empty<Nat, Product>();
  let inventory = Map.empty<Nat, InventoryItem>();
  let sales = Map.empty<Nat, SaleRecord>();
  let rules = Map.empty<Nat, QontohStockRule>();
  let cashTransactions = Map.empty<Nat, CashTransaction>();
  let inventoryReports = List.empty<InventoryReportEntry>();

  // User profiles should be persisted to state
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextProductId = 0;
  var nextInventoryId = 0;
  var nextSaleId = 0;
  var nextStockRuleId = 0;
  var nextCashTransactionId = 0;

  public shared ({ caller }) func addProduct(name : Text, size : Text, category : Text, salePrice : Nat, hpp : Nat, image : Storage.ExternalBlob) : async Nat {
    let productId = nextProductId;
    let product : Product = {
      id = productId;
      name;
      size;
      category;
      salePrice;
      hpp;
      image;
    };
    products.add(productId, product);
    nextProductId += 1;
    productId;
  };

  func normalizeName(name : Text) : Text {
    name.toLower();
  };

  public shared ({ caller }) func addInventoryItem(itemName : Text, category : Text, size : Text, unit : Text, initialStock : Nat, reject : Nat, finalStock : Nat, minimumStock : Nat) : async ?Nat {
    let normalized = normalizeName(itemName);
    if (normalized.isEmpty()) { return null };
    let nameExists = inventory.values().any(func(item) { normalizeName(item.itemName) == normalized });

    if (nameExists) { return null };

    let inventoryId = nextInventoryId;
    let item : InventoryItem = {
      id = inventoryId;
      itemName = normalized;
      category;
      size;
      unit;
      initialStock;
      reject;
      finalStock;
      minimumStock;
    };

    inventory.add(inventoryId, item);
    nextInventoryId += 1;
    ?inventoryId;
  };

  public shared ({ caller }) func updateInventoryItem(id : Nat, itemName : Text, category : Text, size : Text, unit : Text, initialStock : Nat, reject : Nat, finalStock : Nat, minimumStock : Nat) : async Bool {
    switch (inventory.get(id)) {
      case (null) { false };
      case (?_) {
        let normalized = normalizeName(itemName);
        if (normalized.isEmpty()) { return false };
        let nameExists = inventory.values().any(func(item) { item.id != id and normalizeName(item.itemName) == normalized });
        if (nameExists) { return false };

        let updatedItem : InventoryItem = {
          id;
          itemName = normalized;
          category;
          size;
          unit;
          initialStock;
          reject;
          finalStock;
          minimumStock;
        };
        inventory.add(id, updatedItem);
        true;
      };
    };
  };

  public shared ({ caller }) func adjustInventoryStock(itemId : Nat, quantity : Nat, isAddition : Bool, description : Text) : async Bool {
    switch (inventory.get(itemId)) {
      case (null) { false };
      case (?item) {
        let newFinalStock = if (isAddition) {
          item.finalStock + quantity;
        } else {
          if (item.finalStock >= quantity) { item.finalStock - quantity } else { return false };
        };

        let updatedItem = { item with finalStock = newFinalStock };
        inventory.add(itemId, updatedItem);

        let reportEntry : InventoryReportEntry = {
          timestamp = Time.now();
          itemName = item.itemName;
          itemSize = item.size;
          quantity;
          description;
        };

        inventoryReports.add(reportEntry);
        true;
      };
    };
  };

  public query ({ caller }) func listProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func listInventoryItems() : async [InventoryItem] {
    inventory.values().toArray();
  };

  public query ({ caller }) func isInventoryLow() : async Bool {
    inventory.values().any(func(item) { item.finalStock <= item.minimumStock });
  };

  public query ({ caller }) func getInventoryReports(filter : ?Text, daysBack : ?Nat) : async [InventoryReportEntry] {
    let filteredReports = inventoryReports.reverse().filter(
      func(entry) {
        let matchesDescription = switch (filter) {
          case (null) { true };
          case (?f) { entry.description.contains(#text(f)) };
        };
        let matchesTimeFrame = switch (daysBack) {
          case (null) { true };
          case (?days) {
            let nanosecondsPerDay : Nat = 86400000000000;
            let timeLimit : Nat = Time.now().toNat() - (days * nanosecondsPerDay);
            entry.timestamp.toNat() >= timeLimit;
          };
        };
        matchesDescription and matchesTimeFrame;
      }
    );
    filteredReports.toArray();
  };

  public query ({ caller }) func fetchDashboardSummary() : async DashboardSummary {
    let currentTime = Time.now();
    let dayStart = currentTime - (currentTime % 86400000000000);
    var todayRevenue = 0;
    var totalQuantity = 0;
    var danaTotal = 0;
    var qrisTotal = 0;
    var tunaiTotal = 0;
    var trfTotal = 0;

    let salesIter = sales.values();
    for (sale in salesIter) {
      if (sale.timestamp >= dayStart) {
        todayRevenue += sale.amount;
        totalQuantity += sale.totalQuantity;
        switch (sale.paymentMethod) {
          case (#dana) { danaTotal += sale.amount };
          case (#qris) { qrisTotal += sale.amount };
          case (#tunai) { tunaiTotal += sale.amount };
          case (#trf) { trfTotal += sale.amount };
        };
      };
    };

    {
      todayRevenue;
      totalQuantitySold = totalQuantity;
      paymentMethodTotals = {
        dana = danaTotal;
        qris = qrisTotal;
        tunai = tunaiTotal;
        trf = trfTotal;
      };
    };
  };

  public shared ({ caller }) func recordSale(items : [SaleItem], paymentMethod : PaymentMethod, totalTax : Nat) : async Nat {
    let saleId = nextSaleId;
    let totalAmount = items.foldLeft(0, func(acc, item) { acc + (item.quantity * item.unitPrice) });
    let totalQuantity = items.foldLeft(0, func(acc, item) { acc + item.quantity });

    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case (?product) {
          let matchingRule = rules.values().find(
            func(rule) {
              rule.productCategory == product.category and rule.productSize == product.size
            }
          );

          switch (matchingRule) {
            case (?rule) {
              let matchingInventoryId = inventory.values().find(
                func(invItem) {
                  invItem.category == rule.inventoryCategory and invItem.size == rule.inventorySize
                }
              );

              switch (matchingInventoryId) {
                case (?invItem) { if (invItem.finalStock > item.quantity) { let updatedItem = { invItem with finalStock = invItem.finalStock - item.quantity }; inventory.add(invItem.id, updatedItem) } };
                case (null) {};
              };
            };
            case (null) {};
          };
        };
        case (null) {};
      };
    };

    let saleRecord : SaleRecord = {
      amount = totalAmount;
      id = saleId;
      items;
      paymentMethod;
      timestamp = Time.now();
      totalQuantity;
      totalTax;
    };

    sales.add(saleId, saleRecord);
    nextSaleId += 1;
    saleId;
  };

  public query ({ caller }) func querySales(fromTimestamp : Time.Time, toTimestamp : Time.Time) : async [SaleRecord] {
    sales.values().toArray().filter(
      func(sale) {
        sale.timestamp >= fromTimestamp and sale.timestamp <= toTimestamp
      }
    );
  };

  public shared ({ caller }) func updateSale(id : Nat, items : [SaleItem], paymentMethod : PaymentMethod, totalTax : Nat) : async Bool {
    switch (sales.get(id)) {
      case (null) { false };
      case (?existingSale) {
        let totalAmount = items.foldLeft(0, func(acc, item) { acc + (item.quantity * item.unitPrice) });
        let totalQuantity = items.foldLeft(0, func(acc, item) { acc + item.quantity });

        let updatedSale : SaleRecord = {
          existingSale with
          amount = totalAmount;
          items;
          paymentMethod;
          totalQuantity;
          totalTax;
        };

        sales.add(id, updatedSale);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteSale(id : Nat) : async Bool {
    if (sales.containsKey(id)) {
      sales.remove(id);
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func getInventoryUsageStats(category : ?Text, size : ?Text, fromTimestamp : ?Time.Time, toTimestamp : ?Time.Time) : async Nat {
    var totalUsage = 0;

    for (sale in sales.values()) {
      let saleMatchesCategory = switch (category) {
        case (null) { true };
        case (?cat) {
          sale.items.any(
            func(item) {
              switch (products.get(item.productId)) {
                case (?prod) { prod.category == cat };
                case (null) { false };
              };
            }
          );
        };
      };

      let saleMatchesSize = switch (size) {
        case (null) { true };
        case (?s) {
          sale.items.any(
            func(item) {
              switch (products.get(item.productId)) {
                case (?prod) { prod.size == s };
                case (null) { false };
              };
            }
          );
        };
      };

      let saleMatchesTime = switch (fromTimestamp, toTimestamp) {
        case (?from, ?to) { sale.timestamp >= from and sale.timestamp <= to };
        case (?from, null) { sale.timestamp >= from };
        case (null, ?to) { sale.timestamp <= to };
        case (null, null) { true };
      };

      if (saleMatchesCategory and saleMatchesSize and saleMatchesTime) {
        for (item in sale.items.values()) {
          totalUsage += item.quantity;
        };
      };
    };

    totalUsage;
  };

  public shared ({ caller }) func addCashTransaction(amount : Nat, transactionType : TransactionType, description : Text) : async Nat {
    let transactionId = nextCashTransactionId;
    let transaction : CashTransaction = {
      id = transactionId;
      amount;
      transactionType;
      description;
      timestamp = Time.now();
    };
    cashTransactions.add(transactionId, transaction);
    nextCashTransactionId += 1;
    transactionId;
  };

  public query ({ caller }) func getCashTransactionsByDate(startDate : Time.Time, endDate : Time.Time) : async [CashTransaction] {
    cashTransactions.values().toArray().filter(
      func(transaction) {
        transaction.timestamp >= startDate and transaction.timestamp <= endDate
      }
    );
  };

  public query ({ caller }) func getAllCashTransactions() : async [CashTransaction] {
    cashTransactions.values().toArray();
  };

  public shared ({ caller }) func updateCashTransaction(id : Nat, amount : Nat, transactionType : TransactionType, description : Text) : async Bool {
    switch (cashTransactions.get(id)) {
      case (null) { false };
      case (?existingTransaction) {
        let updatedTransaction : CashTransaction = {
          existingTransaction with
          amount;
          transactionType;
          description;
        };

        cashTransactions.add(id, updatedTransaction);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteCashTransaction(id : Nat) : async Bool {
    if (cashTransactions.containsKey(id)) {
      cashTransactions.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getCashBalance() : async Nat {
    var balance = 0;

    for (transaction in cashTransactions.values()) {
      switch (transaction.transactionType) {
        case (#income) { balance += transaction.amount };
        case (#expense) {
          if (balance >= transaction.amount) {
            balance -= transaction.amount;
          };
        };
      };
    };

    balance;
  };
};
