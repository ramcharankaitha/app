const fs = require('fs');
const dir = 'd:/projects/app/src/components/';

const files = [
  'AddChitCustomer.jsx','AddChitPlan.jsx','AddCustomer.jsx','AddDispatch.jsx',
  'AddPayment.jsx','AddProduct.jsx','AddProductPricing.jsx','AddSalesOrder.jsx',
  'AddSalesRecord.jsx','AddService.jsx','AddSupplier.jsx','AddTransport.jsx',
  'CreateSupplierTransaction.jsx','ProductList.jsx','Profile.jsx'
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(dir + f, 'utf8');
    const original = c;
    
    // Fix pattern: </div> followed by <div> then ConfirmDialog
    // Should be: </div></div> then ConfirmDialog
    c = c.replace(/(\s*)<\/div>(\s*)\n(\s*)<div>\n(\s*)<ConfirmDialog/g, 
                '$1</div>$2\n$3</div>\n$4<ConfirmDialog');
    
    // Fix pattern: </div> blank lines then <div> then ConfirmDialog
    c = c.replace(/(\s*)<\/div>(\s*)\n(\s*)\n(\s*)<div>\n(\s*)<ConfirmDialog/g, 
                '$1</div>$2\n$3</div>\n$5<ConfirmDialog');
    
    if (c !== original) {
      fs.writeFileSync(dir + f, c, 'utf8');
      console.log(f + ': Fixed JSX structure');
    }
  } catch(e) {
    console.log(f + ': ERROR - ' + e.message);
  }
});
