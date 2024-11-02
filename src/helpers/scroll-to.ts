const easeInOutQuad = function (t: number, b: number, c: number, d: number) {
    t /= d / 2;
    if (t < 1) {
        return (c / 2) * t * t + b;
    }
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
};

// requestAnimationFrame for Smart Animating http://goo.gl/sx5sts
var requestAnimFrame = (function () {
    return (
        window.requestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        }
    );
})();

/**
 * Because it's so fucking difficult to detect the scrolling element, just move them all
 * @param {number} amount
 */
function move(amount: number, dom?: HTMLElement) {
    if (dom) {
        dom.scrollTop = amount;
    } else {
        document.body.scrollTop = amount;
        document.documentElement.scrollTop = amount;
    }
}

function position() {
    return document.documentElement.scrollTop || document.body.scrollTop;
}

/**
 * @param {number} to
 * @param {number} duration
 * @param {string} selector
 */
export function scrollTo(to: number, duration: number, selector: string) {
    const start = position();
    const change = to - start;
    const increment = 20;
    let currentTime = 0;
    duration = typeof duration === 'undefined' ? 500 : duration;
    const dom = document.querySelector(selector) as HTMLElement;
    // increment the time
    currentTime += increment;
    // find the value with the quadratic in-out easing function
    var val = easeInOutQuad(currentTime, start, change, duration);
    // move the document.body
    move(val, dom);
}
