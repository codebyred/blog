const mode = localStorage.getItem("mode") || "";
const toggle = document.querySelector(".toggle");
const body = document.querySelector("body");
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
let pages = [];

document.body.className = mode;

toggle.addEventListener("click", ()=>{
  localStorage.setItem("mode", mode === "light" ? "" : "light")
  body.classList.toggle("light")
})

fetch('/index.json')
  .then(res => res.json())
  .then(data => pages = data);

function renderResults(results) {
  searchResults.innerHTML = '';
  if (!results.length) {
    searchResults.innerHTML = '<p>No results found.</p>';
    return;
  }
  results.forEach(page => {
    const div = document.createElement('div');
    div.classList.add('resultItem');
    div.innerHTML = `<a href="${page.permalink}"><h3>${page.title}</h3><p>Tags: ${page.tags.join(', ')}</p></a>`;
    searchResults.appendChild(div);
  });

  console.log(results)
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchResults.innerHTML = '';
    return;
  }
  const results = pages.filter(page =>
    page.tags.some(tag => tag.toLowerCase().includes(query))
  );
  console.log(query, results)
  renderResults(results);
});