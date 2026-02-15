import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";

module {
  type PaymentMethod = {
    #dana;
    #qris;
    #tunai;
    #trf;
  };

  type SaleItemOld = {
    productId : Nat;
    quantity : Nat;
    unitPrice : Nat;
  };

  type SaleRecordOld = {
    id : Nat;
    items : [SaleItemOld];
    paymentMethod : PaymentMethod;
    timestamp : Time.Time;
    totalQuantity : Nat;
    amount : Nat;
  };

  type OldActor = {
    sales : Map.Map<Nat, SaleRecordOld>;
  };

  type SaleItemNew = {
    productId : Nat;
    quantity : Nat;
    unitPrice : Nat;
    cogs : Nat;
    productName : Text;
  };

  type SaleRecordNew = {
    id : Nat;
    items : [SaleItemNew];
    paymentMethod : PaymentMethod;
    timestamp : Time.Time;
    totalQuantity : Nat;
    totalTax : Nat;
    amount : Nat;
  };

  type NewActor = {
    sales : Map.Map<Nat, SaleRecordNew>;
  };

  public func run(old : OldActor) : NewActor {
    let newSales = old.sales.map<Nat, SaleRecordOld, SaleRecordNew>(
      func(_id, oldSale) {
        let newItems = oldSale.items.map(
          func(oldItem) {
            {
              oldItem with
              cogs = oldItem.unitPrice * oldItem.quantity;
              productName = "";
            };
          }
        );
        {
          oldSale with
          items = newItems;
          totalTax = 0;
        };
      }
    );
    { sales = newSales };
  };
};
