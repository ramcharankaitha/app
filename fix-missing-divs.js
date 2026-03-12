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
    
    // Look for pattern: </div> followed by blank lines then <ConfirmDialog
    // We need to add an extra </div> before the ConfirmDialog
    const pattern = /(\s*)<\/div>(\s*)\n(\s*)\n(\s*)<ConfirmDialog/;
    const match = c.match(pattern);
    
    if (match) {
      // Add an extra </div> with proper indentation
      const spaces = match[1];
      c = c.replace(pattern, '$1</div>$2\n$3$4<div>\n$4<ConfirmDialog');
      console.log(f + ': Added missing closing div');
    }
    
    if (c !== original) {
      fs.writeFileSync(dir + f, c, 'utf8');
    }
  } catch(e) {
    console.log(f + ': ERROR - ' + e.message);
  }
});
