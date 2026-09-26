const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            if(content.includes("'http://localhost/KABIR/Cretive%20Computer%20Academy/backend/")) {
                content = content.replaceAll("'http://localhost/KABIR/Cretive%20Computer%20Academy/backend/", "(import.meta.env.VITE_API_BASE_URL || 'http://localhost/KABIR/Cretive%20Computer%20Academy/backend/') + '");
                changed = true;
            }
            if(content.includes("`http://localhost/KABIR/Cretive%20Computer%20Academy/backend/")) {
                 content = content.replaceAll("`http://localhost/KABIR/Cretive%20Computer%20Academy/backend/", "`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/KABIR/Cretive%20Computer%20Academy/backend/'}");
                 changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log("Updated", fullPath);
            }
        }
    });
}
replaceInDir('./src');
