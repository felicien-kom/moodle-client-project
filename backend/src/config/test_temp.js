// Test des fonctionnalités de moodleApi.js

const parseServertime = (response) => {
  const dateHeader = response.headers.get("Date");
  if (!dateHeader) return Math.floor(Date.now() / 1000);
  return Math.floor(new Date(dateHeader).getTime() / 1000);
};

const formatted = (isoDate) => {
    return new Intl.DateTimeFormat(navigator.language, {
        dateStyle: 'medium', // ex: 5 avr. 2026
        timeStyle: 'short'  // ex: 11:14 (si l'utilisateur est à GMT+1)
    }).format(new Date(isoDate));
}

const getRelativeTime = (isoDate) => {
  const msPerMinute = 60 * 1000;
  const elapsed = new Date(isoDate) - new Date(); // Différence avec maintenant
  
  const rtf = new Intl.RelativeTimeFormat(navigator.language, { numeric: 'auto' });
  
  const minutes = Math.round(elapsed / msPerMinute);
  return rtf.format(minutes, 'minute'); 
};

async function go() {
    const response = await fetch(`http://localhost/login/token.php`, {
          signal: AbortSignal.timeout(5000),
    });
    const unix_value = parseServertime(response);
    console.log(unix_value);

    const iso_value = new Date(unix_value * 1000).toISOString();
    console.log(iso_value);

    const formatted_value = formatted(iso_value);
    console.log(formatted_value);

    const relative_value = getRelativeTime(iso_value);
    console.log(relative_value);
}

go();