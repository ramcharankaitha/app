const fs = require('fs');
const dir = 'd:/projects/app/src/components/';

// All Pattern B files need two </div> added before the last )} before </>
const files = [
  'CategoryMaster.jsx',
  'ChitEntryMaster.jsx',
  'ChitPlanList.jsx',
  'ChitPlanMaster.jsx',
  'ChitPlans.jsx',
  'DispatchDepartment.jsx',
  'EditProfile.jsx',
  'PaymentMaster.jsx',
  'QuotationMaster.jsx',
  'SalesOrder.jsx',
  'Services.jsx',
  'StockInMaster.jsx',
  'StockOutMaster.jsx',
  'SupplierTransactionMaster.jsx',
  'TransactionProducts.jsx',
  'TransportMaster.jsx',
];

files.forEach(file => {
  const filePath = dir + file;
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  
  // Find the </> line (fragment close) near end of file
  let fragmentIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '</>') {
      fragmentIdx = i;
      break;
    }
  }
  
  if (fragmentIdx === -1) {
    console.log(file + ': ERROR - no </> found');
    return;
  }
  
  // Find the )} line right before </>
  let closingIdx = -1;
  for (let i = fragmentIdx - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === ')}') {
      closingIdx = i;
      break;
    } else if (trimmed !== '') {
      break;
    }
  }
  
  if (closingIdx === -1) {
    console.log(file + ': ERROR - no )} found before </>');
    return;
  }
  
  // Find the </div> line right before )}
  let lastDivIdx = -1;
  for (let i = closingIdx - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '</div>') {
      lastDivIdx = i;
      break;
    } else if (trimmed !== '') {
      break;
    }
  }
  
  if (lastDivIdx === -1) {
    console.log(file + ': ERROR - no </div> found before )}');
    return;
  }
  
  // Now count how many </div> are needed by counting opens vs closes 
  // in the last modal block (from the { conditional before the modal to the )} )
  // Simple approach: insert two </div> after the last </div> and before )}
  const indent1 = '          </div>';  // closes modal inner container
  const indent2 = '        </div>';    // closes modal overlay
  
  lines.splice(lastDivIdx + 1, 0, indent1, indent2);
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(file + ': Added 2 missing </div> for modal container and overlay');
});

console.log('\nDone!');
