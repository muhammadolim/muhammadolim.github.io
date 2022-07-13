const template = document.createElement("template");

template.innerHTML = `
    <link rel="stylesheet" href="css/bootstrap.min.css" />
    <link rel="stylesheet" href="css/style.css" />

    <img class="card-img-top" alt="" />
    <div class="card-body">
        <h5 class="card-title"></h5>
        <p class="card-text"></p>
        <div class="buttons row">
            <a class="btn btn-primary col-6" target="_blank">See live</a>
            <a class="btn btn-success col-6" target="_blank">View code</a>
        </div>
    </div>
`

class MyCard extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    static get observedAttributes() {
        return ['title', 'image', 'description'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.shadowRoot.querySelector("h5").innerText = this.getAttribute("link").replace(/-/g, " ");
        this.shadowRoot.querySelector("img").src = `img/${this.getAttribute("link").toLowerCase()}.png`;
        this.shadowRoot.querySelector("img").alt = this.getAttribute("link").toLowerCase();
        this.shadowRoot.querySelector(".card-text").innerHTML = this.getAttribute("description");
        this.shadowRoot.querySelector(".btn-primary").href = `https://muhammadolim.github.io/${this.getAttribute("link")}`;
        this.shadowRoot.querySelector(".btn-success").href = `https://github.com/muhammadolim/${this.getAttribute("link")}`;
        this.className = `card col-lg-3 col-sm-5 col-11 m-3 mix category-${this.getAttribute("category")}`
    }
}

customElements.define('my-card', MyCard);
