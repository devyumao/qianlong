import { L2Dwidget } from 'live2d-widget/src'

import './index.less'

const loadingEl = document.getElementById('loading')

const displaySize =  Math.min(window.innerWidth * 0.9, 540)

Object.assign(loadingEl.style, {
    width: displaySize + 2 + 'px',
    height: displaySize + 2 + 'px'
})

Object.assign(document.querySelector('#loading .inner').style, {
    width: displaySize + 'px',
    height: displaySize + 'px'
})

L2Dwidget.init({
    model: {
        // jsonPath: 'https://webserver-1256209664.cos.ap-shanghai.myqcloud.com/qianlong/model/qianlong26.model.json',
        jsonPath: './model/qianlong26.model.json',
        onload: handleModelLoad
    },
    display: {
        superSample: 2,
        width: displaySize,
        height: displaySize,
        hOffset: 0,
        vOffset: 0
    },
    mobile: {
        scale: 1
    },
    react: {
        opacityDefault: 1,
        opacityOnHover: 1
    },
    dev: {
        border: false
    }
})

function delay(timeout) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout)
    })
}

function handleModelLoad() {
    delay(2500)
        .then(() => {
            loadingEl.className = 'loading out'
            return delay(1500)
        })
        .then(() => {
        loadingEl.style.zIndex = 1
        const canvasEl = document.getElementById('live2dcanvas')
        canvasEl.className = 'in'
        canvasEl.addEventListener('animationend', () => {
            loadingEl.style.display = 'none'
        })
    })
}
