const fs = require('fs');
const dir = 'd:/projects/app/src/components/';

// Files with missing closing div before ConfirmDialog
const missingDivFiles = [
  'AddChitCustomer.jsx','AddChitPlan.jsx','AddCustomer.jsx','AddDispatch.jsx',
  'AddPayment.jsx','AddProduct.jsx','AddProductPricing.jsx','AddSalesOrder.jsx',
  'AddService.jsx','AddSupplier.jsx','AddTransport.jsx','CreateSupplierTransaction.jsx',
  'ProductList.jsx','Profile.jsx'
];

// Files with extra closing div that needs to be removed
const extraDivFiles = [
  'CategoryMaster.jsx','ChitEntryMaster.jsx','ChitPlanList.jsx','ChitPlanMaster.jsx',
  'ChitPlans.jsx','DispatchDepartment.jsx','EditProfile.jsx','PaymentMaster.jsx',
  'QuotationMaster.jsx','SalesOrder.jsx','Services.jsx','StockInMaster.jsx',
  'StockOutMaster.jsx','SupplierTransactionMaster.jsx','TransactionProducts.jsx',
  'TransportMaster.jsx'
];

// Fix Handler.jsx separately
try {
  let c = fs.readFileSync(dir + 'Handler.jsx', 'utf8');
  // Fix the stray </div> at line 834
  c = c.replace(/(\s*)<\/div>(\s*)<>/g, '$1</>$2');
  fs.writeFileSync(dir + 'Handler.jsx', c, 'utf8');
  console.log('Handler.jsx: Fixed stray closing div');
} catch(e) {
  console.log('Handler.jsx: ERROR - ' + e.message);
}

// Fix files missing closing div
missingDivFiles.forEach(f => {
  try {
    let c = fs.readFileSync(dir + f, 'utf8');
    const original = c;
    
    // Pattern: </div> then blank lines then <div> then ConfirmDialog
    // Replace with: </div></div> then ConfirmDialog
    c = c.replace(/(\s*)<\/div>(\s*)\n(\s*)\n(\s*)<div>\n(\s*)<ConfirmDialog/g, 
                '$1</div>$2\n$3</div>\n$5<ConfirmDialog');
    
    // Pattern: </div> then <div> then ConfirmDialog  
    c = c.replace(/(\s*)<\/div>(\s*)\n(\s*)<div>\n(\s*)<ConfirmDialog/g, 
                '$1</div>$2\n$3</div>\n$4<ConfirmDialog');
    
    if (c !== original) {
      fs.writeFileSync(dir + f, c, 'utf8');
      console.log(f + ': Added missing closing div');
    }
  } catch(e) {
    console.log(f + ': ERROR - ' + e.message);
  }
});

// Fix files with extra closing div
extraDivFiles.forEach(f => {
  try {
    let c = fs.readFileSync(dir + f, 'utf8');
    const original = c;
    
    // Pattern: </div> then </> - remove the </div>
    c = c.replace(/(\s*)<\/div>(\s*)<\/>(\s*)\);\s*$/g, 
                '$1</>$2$3);\n');
    
    if (c !== original) {
      fs.writeFileSync(dir + f, c, 'utf8');
      console.log(f + ': Removed extra closing div');
    }
  } catch(e) {
    console.log(f + ': ERROR - ' + e.message);
  }
});

console.log('JSX fixes complete!');
