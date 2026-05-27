const apiKey = "AIzaSyAyhCV16d8C-C30E5fnZ7qHdy0ux74B5Ak";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log("Supported Models:");
    if (data.models) {
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  })
  .catch(err => console.error(err));
