const url = window.location.origin
const postDataToServer = async (data) => {
    return new Promise((resolve, reject) => {
        fetch(url + '/api/updateAppData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ appData: data })
        })
            .then(response => {
                if (!response.ok) {
                    // Handle HTTP errors
                    throw new Error(`HTTP error! Status: ${response.status}`)
                }
                return response
            })
            .then(data => {
                console.log('Server response:', data)
                resolve(data)
            })
            .catch(error => {
                console.error('Error:', error)
            })
    })
} 


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
    if (!node.isPublished) {
       return;     
    }
    const wrapper = document.querySelector('.content')
    const el = document.createElement('div')
    const data = document.createElement('div')
    data.classList.add('code')
    data.innerHTML = JSON.stringify(node, null, 2) // node
    el.appendChild(data)
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

const addNewNode = async (nodeId = null) => {
    const nodeData = {
        "id": Math.floor(Math.random() * 1000000) + "_",
        "title": null,
        "isPublished": true,
        "preview": { "imgSrc": null, "text": null },
        "tags": [],
        "raiting": 0,
        "content": []
    }


    document.querySelector('.add-new-node').style.display = 'none'
    const wrapper = document.querySelector('.edit-node')

    const close = document.createElement('button')
    close.innerText = 'cancel'
    close.addEventListener('click', () => {
        document.querySelector('.add-new-node').style.display = 'block'
        wrapper.innerHTML = ''
    })
    wrapper.appendChild(close)

    const raiting = document.createElement('input')
    raiting.type = 'text'
    raiting.placeholder = 'raiting'
    raiting.addEventListener('change', () => {
        nodeData.raiting = raiting.value
    })
    wrapper.appendChild(raiting)

    const title = document.createElement('input')
    title.type = 'text'
    title.placeholder = 'title'
    title.addEventListener('change', () => {
        nodeData.title = title.value
    })
    wrapper.appendChild(title)

    const wrIsPublished = document.createElement('div')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = true
    checkbox.addEventListener('change', () => {
        nodeData.isPublished = checkbox.checked
    })
    wrIsPublished.appendChild(checkbox);
    const label = document.createElement('label')
    label.textContent = 'isPublished'
    wrIsPublished.appendChild(label)
    wrapper.appendChild(wrIsPublished)

    const previewText = document.createElement('input')
    previewText.type = 'text'
    previewText.placeholder = 'previewText'
    previewText.addEventListener('change', () => {
        nodeData.preview.text = previewText.value
    })
    wrapper.appendChild(previewText)

    // tags *****************************************************/
    const tagsSet = new Set()
    const tagsWrapper = document.createElement('div')
    wrapper.appendChild(tagsWrapper)

    let tagsWr = null
    const addTagList = () => {
        if (tagsWr) {
            tagsWrapper.removeChild(tagsWr)
        }
        tagsWr = document.createElement('div')
        tagsWrapper.appendChild(tagsWr)

        for (let value of tagsSet ) {
            const t = document.createElement('div')
            tagsWr.appendChild(t)
            const v = document.createElement('span')
            v.textContent = value
            t.appendChild(v)
            const remove = document.createElement('button')
            remove.innerText = 'remove'
            remove.addEventListener('click', () => {
                tagsSet .delete(value)
                t.removeChild(v)
                t.removeChild(remove)
                nodeData.tags = [...tagsSet ]
            })
            t.appendChild(remove)
        }
    }

    const addTagDropdown = () => {
        const wr = document.createElement('div')
        tagsWrapper.appendChild(wr)

        const select = document.createElement('select')
        select.id = Math.floor(Math.random() * 1000) + '_dynamicSelect'
        for (let i = 0; i < appData.tags.length; i++) {
            const option = document.createElement('option')
            option.value = appData.tags[i]
            option.textContent = appData.tags[i]
            select.appendChild(option)
        }
        wr.appendChild(select)
    
        select.addEventListener('change', () => {
          console.log('Выбрано значение:', select.value)
        })

        const remove = document.createElement('button')
        remove.innerText = 'insert current tag'
        remove.addEventListener('click', () => {
            tagsSet .add(select.value)
            nodeData.tags = [...tagsSet]
            wr.removeChild(select)
            wr.removeChild(remove)
            addTagList()
        })
        wr.appendChild(remove)
    }

    const createButtAddTag = document.createElement('button')
    createButtAddTag.innerText = 'add new tag'
    createButtAddTag.addEventListener('click', () => addTagDropdown())
    wrapper.appendChild(createButtAddTag)

    const contentWrapper = document.createElement('div')
    wrapper.appendChild(contentWrapper)

    // create text **********************************************/
    const createElementText = () => {
        const wr = document.createElement('div')
        contentWrapper.appendChild(wr)

        const contentId = Math.floor(Math.random() * 1000) + '_contentId'
        const txt = document.createElement('input')
        txt.type = 'text'
        txt.placeholder = 'content text'
        txt.addEventListener('change', () => {
            let current = null
            for (let i = 0; i < nodeData.content.length; i++) {
                if (nodeData.content[i].contentId === contentId) {
                    current = nodeData.content[i]
                }
            }
            if (current) {
                current.html = txt.value
            } else {
                nodeData.content.push({ contentId, type: 'text', html: txt.value })
            }
        })
        wr.appendChild(txt)

        const remove = document.createElement('button')
        remove.innerText = 'remove'
        remove.addEventListener('click', () => {
            wr.removeChild(txt)
            wr.removeChild(remove)
            nodeData.content = nodeData.content.filter(item => item.contentId !== contentId)
        })
        wr.appendChild(remove)
    }

    const createButtAddText = document.createElement('button')
    createButtAddText.innerText = 'add content text'
    createButtAddText.addEventListener('click', () => createElementText())
    wrapper.appendChild(createButtAddText)

    const save = document.createElement('button')
    save.innerText = 'save'
    save.addEventListener('click', async () => {
        console.log('save', nodeData)
        appData.nodes.splice(0, 0, nodeData)
        await postDataToServer(appData)
        //redirectToAndDrawPage('node', nodeData.id)
        document.querySelector('.edit-node').innerHTML = ''
        updateFullApp()
    })
    wrapper.appendChild(save)
}

const updateFullApp = async () => {
    // clear Prev
    const wrapper = document.querySelector('.content')
    wrapper.innerHTML = ''

    const data = await loadJson()
    appData = data
    const nodesSort = appData.nodes.sort((a, b) => a.raiting - b.raiting)
    for (let i = 0; i < nodesSort.length; i++) {
        drawPreviewNode(nodesSort[i].id)
    }
    const addNewNodeButton = document.querySelector('.add-new-node')
    addNewNodeButton.style.display = 'block'  
}  

document.addEventListener('DOMContentLoaded', async () => { 
    await updateFullApp()
    document.querySelector('.add-new-node').addEventListener('click', () => addNewNode(null)) 
})

window.addEventListener('popstate', (event) => {
    redirectToAndDrawPage()
})