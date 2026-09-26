fetch('https://api.dayalstock.com/api_v1/contents/getContents.php?status=all&page=1&limit=5').then(r=>r.json()).then(d=>console.log(d.data[0]));
