import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const apiMap = {
  'getCategories': 'categoryApi',
  'addCategory': 'categoryApi',
  'updateCategory': 'categoryApi',
  'deleteCategory': 'categoryApi',
  'getTags': 'tagApi',
  'addTag': 'tagApi',
  'updateTag': 'tagApi',
  'deleteTag': 'tagApi',
  'getAllContents': 'contentApi',
  'updateContentStatus': 'contentApi',
  'getAllUsers': 'userApi',
  'deleteUser': 'userApi',
  'updateUserRole': 'userApi',
  'updateUserStatus': 'userApi',
  'getAllAuthor': 'authorApi',
  'getContributorApplications': 'authorApi',
  'updateApplicationStatus': 'authorApi',
  'getAdminNotifications': 'notificationApi',
  'markNotificationAsRead': 'notificationApi'
};

walk('./src', (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace utlis
    content = content.replace(/utlis\/Hooks/g, 'utils/Hooks');
    
    // Replace api imports
    const apiImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"](.*?)api\/api(\.js)?['"]/g;
    
    content = content.replace(apiImportRegex, (match, importsStr, prefix) => {
       const funcs = importsStr.split(',').map(s => s.trim()).filter(Boolean);
       const importsByModule = {};
       funcs.forEach(fn => {
         const module = apiMap[fn] || 'api'; // fallback if not found
         if (!importsByModule[module]) importsByModule[module] = [];
         importsByModule[module].push(fn);
       });
       
       let newImports = '';
       for (const mod in importsByModule) {
         newImports += `import { ${importsByModule[mod].join(', ')} } from "${prefix}api/${mod}";\n`;
       }
       return newImports.trim();
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
