import Map "mo:core/Map";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Product = {
    id : Nat;
    name : Text;
    size : Text;
    salePrice : Nat;
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

  public type UserProfile = {
    name : Text;
  };

  let products = Map.empty<Nat, Product>();
  let inventory = Map.empty<Nat, InventoryItem>();
  let sales = Map.empty<Nat, SaleRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextProductId = 0;
  var nextInventoryId = 0;
  var nextSaleId = 0;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addProduct(name : Text, size : Text, salePrice : Nat, image : Storage.ExternalBlob) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    let productId = nextProductId;
    let product : Product = {
      id = productId;
      name;
      size;
      salePrice;
      image;
    };
    products.add(productId, product);
    nextProductId += 1;
    productId;
  };

  func normalizeName(name : Text) : Text {
    name.toLower();
  };

  public shared ({ caller }) func addInventoryItem(itemName : Text, category : Text, size : Text, unit : Text, initialStock : Nat, reject : Nat, finalStock : Nat) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add inventory items");
    };
    let normalized = normalizeName(itemName);
    if (normalized.isEmpty()) { return null };

    let nameExists = inventory.values().any(
      func(item) {
        normalizeName(item.itemName) == normalized;
      }
    );

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
    };

    inventory.add(inventoryId, item);
    nextInventoryId += 1;
    ?inventoryId;
  };

  public shared ({ caller }) func updateInventoryItem(id : Nat, itemName : Text, category : Text, size : Text, unit : Text, initialStock : Nat, reject : Nat, finalStock : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update inventory items");
    };
    switch (inventory.get(id)) {
      case (null) { false };
      case (?_) {
        let normalized = normalizeName(itemName);
        if (normalized.isEmpty()) { return false };

        let nameExists = inventory.values().any(
          func(item) {
            item.id != id and normalizeName(item.itemName) == normalized;
          }
        );

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
        };
        inventory.add(id, updatedItem);
        true;
      };
    };
  };

  public shared ({ caller }) func adjustInventoryStock(itemId : Nat, quantity : Nat, isAddition : Bool) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can adjust inventory stock");
    };
    switch (inventory.get(itemId)) {
      case (null) { false };
      case (?item) {
        let newFinalStock = if (isAddition) {
          item.finalStock + quantity;
        } else {
          if (item.finalStock >= quantity) {
            item.finalStock - quantity;
          } else { return false };
        };
        let updatedItem = {
          item with
          finalStock = newFinalStock
        };
        inventory.add(itemId, updatedItem);
        true;
      };
    };
  };

  public query ({ caller }) func listProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.values().toArray();
  };

  public query ({ caller }) func listInventoryItems() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory");
    };
    inventory.values().toArray();
  };

  public query ({ caller }) func fetchDashboardSummary() : async DashboardSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can record sales");
    };
    let saleId = nextSaleId;
    let totalAmount = items.foldLeft(0, func(acc, item) { acc + (item.quantity * item.unitPrice) });
    let totalQuantity = items.foldLeft(0, func(acc, item) { acc + item.quantity });

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales");
    };
    sales.values().toArray().filter(
      func(sale) {
        sale.timestamp >= fromTimestamp and sale.timestamp <= toTimestamp
      }
    );
  };

  public shared ({ caller }) func updateSale(id : Nat, items : [SaleItem], paymentMethod : PaymentMethod, totalTax : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update sales");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete sales");
    };

    if (sales.containsKey(id)) {
      sales.remove(id);
      true;
    } else {
      false;
    };
  };
};
