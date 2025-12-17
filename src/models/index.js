import sequelize from '../config/db.js';
import Company from './Company.js';
import Resolution from './Resolution.js';
import Customer from './Customer.js';
import Product from './Product.js';
import Invoice from './Invoice.js';
import InvoiceItem from './InvoiceItem.js';
import CreditNote from './CreditNote.js';
import VerificationCode from './VerificationCode.js';
import PasswordResetToken from './PasswordResetToken.js';
import TestSetValidation from './TestSetValidation.js';
import Category from './Category.js';
import InventoryProduct from './InventoryProduct.js';
import City from './City.js';
import Client from './Client.js';
import Sale from './Sale.js';
import SaleDetail from './SaleDetail.js';
import PaymentMethod from './PaymentMethod.js';
import TaxConfiguration from './TaxConfiguration.js';
import SalePayment from './SalePayment.js';
import Discount from './Discount.js';
import SaleReturn from './SaleReturn.js';

// ==========================================
// RELACIONES
// ==========================================

// Company -> Resolution (1:N)
Company.hasMany(Resolution, { foreignKey: 'company_id' });
Resolution.belongsTo(Company, { foreignKey: 'company_id' });

// Company -> Customer (1:N)
Company.hasMany(Customer, { foreignKey: 'company_id' });
Customer.belongsTo(Company, { foreignKey: 'company_id' });

// Company -> Product (1:N)
Company.hasMany(Product, { foreignKey: 'company_id' });
Product.belongsTo(Company, { foreignKey: 'company_id' });

// Company -> Invoice (1:N)
Company.hasMany(Invoice, { foreignKey: 'company_id' });
Invoice.belongsTo(Company, { foreignKey: 'company_id' });

// Resolution -> Invoice (1:N)
Resolution.hasMany(Invoice, { foreignKey: 'resolution_id' });
Invoice.belongsTo(Resolution, { foreignKey: 'resolution_id' });

// Customer -> Invoice (1:N)
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });

// Invoice -> InvoiceItem (1:N)
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// Product -> InvoiceItem (1:N)
Product.hasMany(InvoiceItem, { foreignKey: 'product_id' });
InvoiceItem.belongsTo(Product, { foreignKey: 'product_id' });

// Invoice -> CreditNote (1:N)
Invoice.hasMany(CreditNote, { foreignKey: 'invoice_id' });
CreditNote.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// Company -> CreditNote (1:N)
Company.hasMany(CreditNote, { foreignKey: 'company_id' });
CreditNote.belongsTo(Company, { foreignKey: 'company_id' });

// Company -> TestSetValidation (1:N)
Company.hasMany(TestSetValidation, { foreignKey: 'company_id' });
TestSetValidation.belongsTo(Company, { foreignKey: 'company_id' });

// Invoice -> TestSetValidation (1:1)
Invoice.hasOne(TestSetValidation, { foreignKey: 'invoice_id' });
TestSetValidation.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// ==========================================
// RELACIONES INVENTARIO
// ==========================================

// Category -> InventoryProduct (1:N)
Category.hasMany(InventoryProduct, { foreignKey: 'category_id', as: 'products' });
InventoryProduct.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ==========================================
// RELACIONES CLIENTES
// ==========================================

// City -> Client (1:N)
City.hasMany(Client, { foreignKey: 'city_id', as: 'clients' });
Client.belongsTo(City, { foreignKey: 'city_id', as: 'city' });

// ==========================================
// RELACIONES VENTAS
// ==========================================

// Client -> Sale (1:N)
Client.hasMany(Sale, { foreignKey: 'client_id', as: 'sales' });
Sale.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// PaymentMethod -> Sale (1:N)
PaymentMethod.hasMany(Sale, { foreignKey: 'payment_id', as: 'sales' });
Sale.belongsTo(PaymentMethod, { foreignKey: 'payment_id', as: 'paymentMethod' });

// Discount -> Sale (1:N)
Discount.hasMany(Sale, { foreignKey: 'discount_id', as: 'sales' });
Sale.belongsTo(Discount, { foreignKey: 'discount_id', as: 'discount' });

// Sale -> SaleDetail (1:N)
Sale.hasMany(SaleDetail, { foreignKey: 'sale_id', as: 'details' });
SaleDetail.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

// InventoryProduct -> SaleDetail (1:N)
InventoryProduct.hasMany(SaleDetail, { foreignKey: 'product_id', as: 'saleDetails' });
SaleDetail.belongsTo(InventoryProduct, { foreignKey: 'product_id', as: 'product' });

// Sale -> SalePayment (1:N)
Sale.hasMany(SalePayment, { foreignKey: 'sale_id', as: 'payments' });
SalePayment.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

// PaymentMethod -> SalePayment (1:N)
PaymentMethod.hasMany(SalePayment, { foreignKey: 'payment_method_id', as: 'payments' });
SalePayment.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id', as: 'paymentMethod' });

// Sale -> SaleReturn (1:N)
Sale.hasMany(SaleReturn, { foreignKey: 'sale_id', as: 'returns' });
SaleReturn.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

export {
  sequelize,
  Company,
  Resolution,
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  CreditNote,
  VerificationCode,
  PasswordResetToken,
  TestSetValidation,
  Category,
  InventoryProduct,
  City,
  Client,
  Sale,
  SaleDetail,
  PaymentMethod,
  TaxConfiguration,
  SalePayment,
  Discount,
  SaleReturn
};