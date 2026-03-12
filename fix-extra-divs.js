const fs = require('fs');
const dir = 'd:/projects/app/src/components/';

const files = [
  'CategoryMaster.jsx','ChitEntryMaster.jsx','ChitPlanList.jsx','ChitPlanMaster.jsx',
  'ChitPlans.jsx','DispatchDepartment.jsx','EditProfile.jsx','PaymentMaster.jsx',
  'QuotationMaster.jsx','SalesOrder.jsx','Services.jsx','StockInMaster.jsx',
  'StockOutMaster.jsx','SupplierTransactionMaster.jsx','TransactionProducts.jsx',
  'TransportMaster.jsx'
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(dir + f, 'utf8');
    const original = c;
    
    // Look for pattern: </div> followed by </> - we need to remove the </div>
    const pattern = /(\s*)<\/div>(\s*)<\/>(\s*)\);\s*$/;
    const match = c.match(pattern);
    
    if (match) {
      // Remove the </div> before </>
      const spaces = match[1];
      c = c.replace(pattern, spaces + '</>' + match[2] + match[3] + ');\n');
      console.log(f + ': Removed extra closing div');
    }
    
    if (c !== original) {
      fs.writeFileSync(dir + f, c, 'utf8');
    }
  } catch(e) {
    console.log(f + ': ERROR - ' + e.message);
  }
});
