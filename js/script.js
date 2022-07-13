document.addEventListener("DOMContentLoaded", function () {

    // *** sorting cards animation setup ***

    var mixer = mixitup('.projects', {
        "animation": {
            "duration": 300,
            "nudge": false,
            "reverseOut": false,
            "effects": "fade translateZ(6px) scale(0.62) stagger(30ms)"
        }
    })


    // *** (to keep cards height the same) fit card text to its card's height ***

    var cards = document.querySelectorAll('my-card');

    cards.forEach((card) => {
        var title = card.shadowRoot.querySelector("h5");
        var text = card.shadowRoot.querySelector(".card-text");

        // scrollTopMax = scrollHeight - clientHeight (not always work well)

        while (title.scrollHeight > title.clientHeight) {
            var oldVal = parseInt(window.getComputedStyle(title, null).getPropertyValue('font-size'))
            title.style.fontSize = `${oldVal - 1}px`;
        }

        while (text.scrollHeight > text.clientHeight) {
            var oldVal = parseInt(window.getComputedStyle(text, null).getPropertyValue('font-size'))
            text.style.fontSize = `${oldVal - 1}px`;
        }

        // just extension for responsive testing

        window.addEventListener('resize', function () {
            while (title.scrollHeight > title.clientHeight) {
                var oldVal = parseInt(window.getComputedStyle(title, null).getPropertyValue('font-size'))
                title.style.fontSize = `${oldVal - 1}px`;
            }

            while (text.scrollHeight > text.clientHeight) {
                var oldVal = parseInt(window.getComputedStyle(text, null).getPropertyValue('font-size'))
                text.style.fontSize = `${oldVal - 1}px`;
            }
        }, true);

    });


    // *** toggle active for categories ***

    var categories = document.querySelectorAll(".categories .nav-link");

    categories.forEach((category) => {
        category.addEventListener("click", () => {
            categories.forEach((c) => {
                c.classList.remove('active')
            })
            category.classList.add('active')
        });
    })

});
