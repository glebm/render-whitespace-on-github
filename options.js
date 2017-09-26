const DEFAULTS = {
    whitespaceOpacity: 0.4,
    copyableWhitespace: false,
    space: '·',
    tab: '→',
};
const ui = {};
function init() {
    ui.form = document.querySelector('form');
    ui.whitespaceOpacity = ui.form.querySelector('[name="whitespace-opacity"]');
    ui.copyableWhitespace = ui.form.querySelector('[name="copyable-whitespace"]');
    ui.space = ui.form.querySelector('[name="space"]');
    ui.tab = ui.form.querySelector('[name="tab"]');
    ui.submitButton = ui.form.querySelector('[type="submit"]');
    ui.whitespaceIndicatorInputs = Array.from(ui.form.querySelectorAll('.whitespace-indicator-input'));
    ui.status = document.querySelector('#status');
    ui.preview = document.querySelector('#preview');
    ui.restoreDefaultsBtn = document.querySelector('#restore-defaults');

    browser.storage.sync.get(DEFAULTS).then(restoreOptions, onError);
    ui.whitespaceOpacity.addEventListener('input', updatePreview);
    for (const input of ui.whitespaceIndicatorInputs) {
        input.addEventListener('focus', function(evt) {
            evt.target.select();
        });
        input.addEventListener('input', updatePreview);
    }
    ui.form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveOptions();
    });
    ui.form.addEventListener('input', function() {
        ui.status.innerText = 'Unsaved changes';
        updateRestoreDefaultsBtnDisabled();
    });
    ui.restoreDefaultsBtn.addEventListener('click', function() {
        restoreOptions(DEFAULTS);
        ui.status.innerText = 'Unsaved changes';
        ui.restoreDefaultsBtn.disabled = true;
    });
}
document.addEventListener('DOMContentLoaded', init);

function saveOptions() {
    ui.submitButton.disabled = true;
    ui.status.innerText = 'Saving...';
    browser.storage.sync.set(getFormValues()).then(function() {
        ui.submitButton.disabled = false;
        ui.status.innerText = 'Saved';
    }, function(error) {
        ui.submitButton.disabled = false;
        ui.status.innerText = "Error: ${error}";
        onError(error);
    });
}

function restoreOptions({whitespaceOpacity, copyableWhitespace, space, tab}) {
    ui.whitespaceOpacity.value = whitespaceOpacity;
    ui.copyableWhitespace.checked = copyableWhitespace;
    ui.space.value = space;
    ui.tab.value = tab;
    updatePreview();
    updateRestoreDefaultsBtnDisabled();
}

function getFormValues() {
    return {
        whitespaceOpacity: +ui.whitespaceOpacity.value,
        copyableWhitespace: ui.copyableWhitespace.checked,
        space: ui.space.value,
        tab: ui.tab.value
    };
}

function updatePreview() {
    ui.preview.innerText = `${ui.tab.value.padEnd(4)}${ui.space.value.repeat(3)}`;
    ui.preview.style.opacity = ui.whitespaceOpacity.value;
}

function updateRestoreDefaultsBtnDisabled() {
    const formValues = getFormValues();
    ui.restoreDefaultsBtn.disabled =
        Object.keys(DEFAULTS).every(k => DEFAULTS[k] === formValues[k]);
}

function onError(error) {
    console.log(error);
}

const browser = typeof window.browser !== 'undefined' ? window.browser : {
    storage: {
        sync: {
            get(...args) {
                return chromeCallbackToPromise(function(...xs) {
                    chrome.storage.sync.get(...xs);
                }, ...args);
            },
            set(...args) {
                return chromeCallbackToPromise(function(...xs) {
                    chrome.storage.sync.set(...xs);
                }, ...args);
            }
        }
    }
};

function chromeCallbackToPromise(fn, ...args) {
    return new Promise(function(resolve, reject) {
        fn(...args, function(...callbackArgs) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(...callbackArgs);
            }
        });
    });
}
