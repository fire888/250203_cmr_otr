// Загружаем JSON-файл с помощью fetch
const loadJson = () => {
    return new Promise(res => {
        fetch('./content.json')
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not OK: ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          res(data)
        })
        .catch(error => {
          console.error('Fetch error:', error);
        });
    })
}
// check parameters from url
const checkParamsUrl = () => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const data = {
        nodeId: null,
        mode: null,
        listId: null, 
    }
    for (const [key, value] of urlParams.entries()) {
        console.log(key, value);
        if (key === 'node') {
            data.nodeId = value
        }
        if (key === 'mode') {
            data.mode = value
        }
        if (key === 'list') {
            data.listId = value
        }
    }
    return data
}

/** GLOBAL DATA **********************************/
// window
let w = window.innerWidth
let h = window.innerHeight
let minKey = w < h ? 'w' : 'h'
document.addEventListener('resize', () => {
    w = window.innerWidth
    h = window.innerHeight
    minKey = w < h ? 'w' : 'h'
})
const OW = 50 // offsetW
// app data
let appData = null

const clearContent = () => {
    const wrapper = document.querySelector('.content')
    wrapper.innerHTML = ''
    window.scrollTo(0, 0)
} 

const drawImage = async (src, wrapper) => {
    return new Promise(res => {
        const img = document.createElement('img')
        img.onload = () => {
            wrapper.appendChild(img)
            res()
        }
        img.src = src

        if (minKey === 'w') {
            img.style.width = w - OW + 'px'
            img.style.height = 'auto'
        } else {
            img.style.height = h - OW + 'px'
            img.style.width = 'auto'
        }
    })
}

const drawText = (text, wrapper, size = 16) => {
    const p = document.createElement("p")
    p.innerHTML= text
    p.style.fontSize = size + "px"
    p.style.height = 'auto'
    p.style.alignContent = 'left'
    p.style.padding = '0 20px' 
    if (minKey === 'w') {
        p.style.width = w - OW + 'px'
    } else {
        p.style.width = h - OW + 'px'
    }
    wrapper.appendChild(p)
}

const drawPreviewNode = async (nodeId) => {    
    const node = appData.nodes.find(node => node.id === nodeId)
    if (!node) {
        console.log('node not found:' + nodeId)
        return;
    }
    console.log('nodepreview', nodeId, node.preview)
    if (!node.isPublished) {
       return;     
    }
    const wrapper = document.querySelector('.content')
    const el = document.createElement('div')
    el.classList.add('view-list-item')
    wrapper.appendChild(el)
    const { imgSrc, text } = node.preview
    if (imgSrc) {
        await drawImage(imgSrc, el)
    }
    if (text) {
        drawText(text, el)
    }
    el.addEventListener('click', () => {
        redirectToAndDrawPage('node', nodeId)
    })
}


const drawNode = async (nodeId) => {
    clearContent()
    
    const node = appData.nodes.find(node => node.id === nodeId)
    if (!node) {
        console.log('node not found:' + nodeId)
        return;
    }
    if (!node.isPublished) {
        return;     
    }
    if (!node.content) {
        console.log('node content not found:' + nodeId)
        return;
    }

    console.log('nodecontent', nodeId, node.content)
    const wrapper = document.querySelector('.content')

    for (let i = 0; i < node.content.length; i++) {
        if (node.content[i].type === 'img') {
            await drawImage(node.content[i].src, wrapper)
        }
        if (node.content[i].type === 'text') {
            const { html, size} = node.content[i]  
            drawText(html, wrapper, size)
        }
    }
}

const drawList = async (listId) => {
    clearContent()
    const nodes = appData.nodes.filter(e => {
        if (!e.tags) {
            return false;
        }
        const is = e.tags.find(t => t === listId)
        return !!is
    })

    for (let i = 0; i < nodes.length; i++) {
        await drawPreviewNode(nodes[i].id) 
    }
}

const redirectToAndDrawPage = async (type, id) => {
    if (type && id) {
        window.history.pushState(
            { someData: 123 },
            '',                     
            `?${type}=${id}`
        );
    }
    const params = checkParamsUrl()
    if (params.nodeId) {
        await drawNode(params.nodeId)
    }
    if (params.listId) {
        await drawList(params.listId)
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const links = document.querySelectorAll('.nav-item') 
    links.forEach((link) => {
        link.addEventListener('click', () => {
            links.forEach((link) => {
                link.classList.remove('current')
            })
            link.classList.add('current')
            redirectToAndDrawPage('list', link.id)
        })
    })
    const data = await loadJson()
    appData = data

    redirectToAndDrawPage()
})

window.addEventListener('popstate', (event) => {
    redirectToAndDrawPage()
})