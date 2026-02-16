import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  type OldProduct = {
    id : Nat;
    name : Text;
    size : Text;
    category : Text;
    salePrice : Nat;
    image : Storage.ExternalBlob;
  };

  type OldActor = {
    products : Map.Map<Nat, OldProduct>;
    // Only preserving the field relevant to the migration.
  };

  type NewProduct = {
    id : Nat;
    name : Text;
    size : Text;
    category : Text;
    salePrice : Nat;
    hpp : Nat; // New field
    image : Storage.ExternalBlob;
  };

  // Only preserving the field relevant to the migration.
  type NewActor = {
    products : Map.Map<Nat, NewProduct>;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        { oldProduct with hpp = 0 };
      }
    );
    { products = newProducts };
  };
};
