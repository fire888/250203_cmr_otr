const getFormattedDate = () => {
    const date = new Date()
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

/******** API  *******************************************************/

const loadJson = async () => {
    const response = await fetch('./content.json')
    if (!response.ok) {
        throw new Error('Network response was not OK: ' + response.status)
    }
    const data = await response.json()
    return data
}
const postDataToServer = async (data) => {
    const response = await fetch('./api/updateAppData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appData: data })
    })
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return 'Update successful'
}
const postFileToServer = async (data) => {
    const result = await fetch('./api/upload-image', {
        method: 'POST',
        body: data
    })
    if (!result.ok) {
        throw new Error('Network response was not ok: ' + result.status)
    }
    return 'upload successful'
}
const deleteFileFromServer = async (fileName) => {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ fileName })
    })
    if (!response.ok) {
      throw new Error('Delete file not successful: ' + response.status)
    }
    return 'Delete successful'
}

const checkParamsUrl = () => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const data = {
        nodeId: null,
        listId: null, 
    }
    for (const [key, value] of urlParams.entries()) {
        if (key === 'node') {
            data.nodeId = value
        }
        if (key === 'list') {
            data.listId = value
        }
    }
    return data
}

/** GLOBAL DATA ***********************************************/

let w = window.innerWidth
let h = window.innerHeight
let minKey = w < h ? 'w' : 'h'
document.addEventListener('resize', () => {
    w = window.innerWidth
    h = window.innerHeight
    minKey = w < h ? 'w' : 'h'
})
const OW = 50 // offsetW
let appData = null

/** elements node ********************************************/

const drawElem = (type, parent = null, html = '', className = null) => {
    const elem = document.createElement(type)
    className && elem.classList.add(className)
    html && (elem.innerText = html)
    parent && parent.appendChild(elem)
    return elem
}

const drawInput = (wrapper, type, value, placeholder) => {
    const elem = document.createElement('input')
    wrapper.appendChild(elem)
    elem.type = type
    value && (elem.value = value)
    placeholder && (elem.placeholder = placeholder)
    return elem
}

const drawEmptyLine = (wrapper, h = 30) => {
    const elem = drawElem('div', wrapper)
    elem.style.minHeight = h + 'px'
}
const drawAlert = () => new Promise(res => { 
    const alrt = drawElem('div', document.body, '', 'alert')
    drawElem('button', alrt, '✖️').onclick = () => {
        alrt.innerHTML = ''
        document.body.removeChild(alrt)
        res(false)
    }   
    drawElem('button', alrt, '✅').onclick = () => {
        alrt.innerHTML = ''
        document.body.removeChild(alrt)
        res(true)
    }
})
const drawImage = async (src, wrapper) => {
    return new Promise(res => {
        const img = document.createElement('img')
        img.style.height = '200px'
        img.onload = () => {
            wrapper.appendChild(img)
            res()
        }
        img.src = src
    })
}
const drawText = (text, wrapper, size = 16) => {
    const p = document.createElement("p")
    p.innerHTML= text
    p.style.fontSize = size + "px"
    p.style.height = 'auto'
    p.style.alignContent = 'left'
    p.style.padding = '0 20px' 
    wrapper.appendChild(p)
}

/** order content get Wrapper and move content top buttom by id */
const createOrderContent = (wrapper) => {
    const elems = []
    return { 
        addElem: ({ contentId, dom }) => {
            elems.push({ contentId, dom })
            wrapper.appendChild(dom) 
        },
        destroyElem: (contentId) => {
            let index = null
            for (let i = 0; i < elems.length; ++i) {
                if (elems[i].contentId !== contentId) continue;
                index = i
                break; 
            }
            if (index !== null)
            elems[index].dom.innerHTML = ''
            wrapper.removeChild(elems[index].dom)
            elems.splice(index, 1)
        },
        moveTop: (contentId) => {
            let prevIndex = null
            let currentIndex = null
            for (let i = 0; i < elems.length - 1; ++i) {
                if (elems[i + 1].contentId !== contentId) continue;
                prevIndex = i
                currentIndex = i + 1
                break;
            }
            if (currentIndex === null || prevIndex === null) return;
            wrapper.insertBefore(elems[currentIndex].dom, elems[prevIndex].dom)
            const saved = elems[prevIndex]
            elems[prevIndex] = elems[currentIndex]
            elems[currentIndex] = saved
        },
        moveBottom: (contentId) => {
            let currentIndex = null
            let nextIndex = null
            for (let i = 0; i < elems.length - 1; ++i) {
                if (elems[i].contentId !== contentId) continue;
                currentIndex = i
                nextIndex = i + 1
                break;
            }
            if (currentIndex === null || nextIndex === null) return;
            if (elems[nextIndex].dom.nextSibling) {
              wrapper.insertBefore(elems[currentIndex].dom, elems[nextIndex].dom.nextSibling);
            } else {
              wrapper.appendChild(elems[currentIndex].dom);
            }
            const saved = elems[nextIndex]
            elems[nextIndex] = elems[currentIndex]
            elems[currentIndex] = saved
        },
        getOrder: () => {
            return elems.map(e => e.contentId)
        }
    }
}

/** node ********************************** */
const drawPreviewNode = async (nodeId, wrapper) => {    
    const node = appData.nodes.find(node => node.id === nodeId)
    if (!node) {
        console.log('node not found:' + nodeId)
        return;
    }

    const el = drawElem('div', wrapper, null, 'view-list-item')
    el.addEventListener('click', () => {
        redirectToAndDrawPage('node', nodeId)
    })

    if (!node.isPublished) {
       el.classList.add('red')    
    }

    const { imgSrc, text } = node.preview
    imgSrc && await drawImage(imgSrc, el) 
    text && drawText(text, el)
    if (!imgSrc && !text) {
        drawText(node.id, el)
        node.title && drawText(node.title, el)
        node.tags.length > 0 && drawText(JSON.stringify(node.tags), el)
        if (node.content[0] && node.content[0].type === 'img') {
            await drawImage(node.content[0].src, el)
        }
        if (node.content[1] && node.content[1].type === 'text') {
            drawText(node.content[1].html, el)
        }
    }
}
const drawNode = async (nodeId) => {
    const addNewNodeButton = document.querySelector('.add-new-node')
    addNewNodeButton.style.display = 'none'  

    const node = appData.nodes.find(node => node.id === nodeId)
    if (!node) {
        console.log('node not found:' + nodeId)
        return;
    }

    const wrapper = document.querySelector('.content')

    drawElem('button', wrapper, '✏️✏️✏️✏️✏️✏️✏️✏️').addEventListener('click', e => {
        wrapper.removeChild(e.target)
        formsEditNode(nodeId)
    })
    drawElem('button', wrapper, '🗑️🗑️🗑️🗑️🗑️🗑️🗑️').addEventListener('click', async e => {
        const isOk = await drawAlert()
        if (!isOk) {
            return;
        }
        appData.nodes = appData.nodes.filter(n => n.id !== nodeId)
        await postDataToServer(appData)
        redirectToAndDrawPage()
    })
    if (!node.isPublished) {
        drawElem('div', wrapper, 'NOT PUBLISHED', 'red')     
    }
    for (let i = 0; i < node.content.length; i++) {
        if (node.content[i].type === 'img') {
            await drawImage(node.content[i].src, wrapper)
        }
        if (node.content[i].type === 'text') {
            const { html, size} = node.content[i]  
            drawText(html, wrapper, size)
        }
    }

    drawElem('div', wrapper, JSON.stringify(node, null, 2), 'code')
}
/** list ********************************************************** */
const drawList = async (listId) => {
    const addNewNodeButton = document.querySelector('.add-new-node')
    addNewNodeButton.style.display = 'block'  
    const contentWrapper = document.querySelector('.content')

    let nodes
    if (listId) { 
        nodes = appData.nodes.filter(e => {
            const is = e.tags.find(t => t === listId)
            return !!is
        })
    } else {
        nodes = appData.nodes
    }
    nodes = nodes.sort((a, b) => b.raiting - a.raiting)
    for (let i = 0; i < nodes.length; i++) {
        await drawPreviewNode(nodes[i].id, contentWrapper) 
    }
}
/** reset page ********************************************/
const redirectToAndDrawPage = async (type = null, id = null) => {
    const wrapperEdit = document.querySelector('.edit-node')
    wrapperEdit.innerHTML = ''
    const wrapper = document.querySelector('.content')
    wrapper.innerHTML = ''
    window.scrollTo(0, 0)

    const data = await loadJson()
    appData = data

    if (type && id) {
        window.history.pushState({ someData: 123 }, '', `?${type}=${id}`)
    } else {
        window.history.pushState({ someData: 123 }, '', '?')
    }

    const params = checkParamsUrl()
    if (params.nodeId) {
        await drawNode(params.nodeId)
    }
    if (params.listId) {
        await drawList(params.listId)
    }
    if (!params.nodeId && !params.listId) {
        await drawList(null)
    }
}

/** edit *********************************************************** */
const formsEditNode = async (nodeId = null) => {
    let nodeData = null
    if (!nodeId) {
        nodeData = {
            "id": Math.floor(Math.random() * 1000000) + "_",
            "title": null,
            "isPublished": true,
            "preview": { "imgSrc": null, "text": null },
            "tags": [],
            "raiting": 0,
            "content": []
        }
    } else {
        nodeData = appData.nodes.find(node => node.id === nodeId)
    } 

    document.querySelector('.add-new-node').style.display = 'none'
    const wrapper = document.querySelector('.edit-node')

    drawElem('button', wrapper, '↗️').addEventListener('click', () => {
        nodeId 
            ? redirectToAndDrawPage('node', nodeId) 
            : redirectToAndDrawPage()
    })
    drawEmptyLine(wrapper)

    drawInput(wrapper, 'text', nodeData.title, 'title').addEventListener('change', e => {
        nodeData.title = e.target.value
    })
    drawInput(wrapper, 'text', nodeData.raiting, 'raiting').addEventListener('change', e => {
        nodeData.raiting = e.target.value
    })

    const wrIsPublished = drawElem('div', wrapper)
    const checkbox = drawInput(wrIsPublished, 'checkbox')
    checkbox.checked = nodeData.isPublished
    checkbox.addEventListener('change', () => {
        nodeData.isPublished = checkbox.checked
    })
    drawElem('label', wrIsPublished, 'isPublished')

    drawInput(wrapper, 'text', nodeData.preview.text, 'previewText').addEventListener('change', e => {
        nodeData.preview.text = e.target.value
    })
    drawEmptyLine(wrapper)

    // preview image *************************************************/
    const S = 250
    const showImage = document.createElement('img')
    showImage.style.width = 50 + 'px'
    showImage.style.height = 50 + 'px'
    if (nodeData.preview.imgSrc) {
        showImage.src = nodeData.preview.imgSrc
    }
    wrapper.appendChild(showImage)
    const prImgInput = document.createElement('input')
    prImgInput.type = 'file'
    prImgInput.accept = 'image/*'
    prImgInput.addEventListener('change', () => {
        const file = prImgInput.files[0]
        const reader = new FileReader()
        reader.addEventListener('load', e => {
            const originalDataUrl = e.target.result
            const img = new Image()
            img.onload = () => {
              const maxWidth = S
              const scaleFactor = maxWidth / img.width
    
              const canvasPreview = document.createElement('canvas');
              canvasPreview.width = maxWidth
              canvasPreview.height = img.height * scaleFactor
              const ctx = canvasPreview.getContext('2d');
              ctx.drawImage(img, 0, 0, canvasPreview.width, canvasPreview.height);
              const resizedDataUrl = canvasPreview.toDataURL('image/jpeg', 1);
              showImage.src = resizedDataUrl;

              nodeData.preview.imageCandidate = { canvasPreview }
            }
            img.src = originalDataUrl
        })
        reader.readAsDataURL(file)
    })
    wrapper.appendChild(prImgInput)
    drawElem('button', wrapper, '✖️').addEventListener('click', () => {
        showImage.removeAttribute("src");
        if (nodeData.preview.imageCandidate) {
            nodeData.preview.imageCandidate.message = "mustDelete" 
        } else {
            nodeData.preview.imageCandidate = { message: "mustDelete" }
        }
    })
    drawEmptyLine(wrapper)


    // tags *****************************************************/
    let tagsSet = new Set()
    if (nodeData.tags) {
        tagsSet = new Set(nodeData.tags)
    }
    const tagsWrapper = drawElem('div', wrapper)

    let tagsInnerWr = null
    const addTagList = () => {
        if (tagsInnerWr) {
            tagsWrapper.removeChild(tagsInnerWr)
        }
        tagsInnerWr = drawElem('div', tagsWrapper)

        for (let value of tagsSet ) {
            const t = drawElem('div', tagsInnerWr)
            drawElem('span', t, value)
            drawElem('button', t, '✖️').addEventListener('click', () => {
                t.innerText = ''
                tagsInnerWr.removeChild(t)
                tagsSet.delete(value)
                nodeData.tags = [...tagsSet ]
            })
        }
    }
    addTagList()
    
    const addTagDropdown = () => {
        const wr = drawElem('div', tagsWrapper)

        const select = document.createElement('select')
        select.id = Math.floor(Math.random() * 1000) + '_dynamicSelect'
        for (let i = 0; i < appData.tags.length; i++) {
            const option = drawElem('option', select, appData.tags[i])
            option.value = appData.tags[i]
        }
        wr.appendChild(select)
    
        drawElem('button', wr, '✔️').addEventListener('click', () => {
            tagsWrapper.removeChild(wr)
            tagsSet.add(select.value)
            nodeData.tags = [...tagsSet]
            addTagList()
        })
    }
    drawElem('button', wrapper, '➕').addEventListener('click', addTagDropdown)
    drawEmptyLine(wrapper)


    /** CONTENT ********************************************/ 

    // order content node for move bottom/top
    const contentWrapper = document.createElement('div')
    wrapper.appendChild(contentWrapper)
    const orderContent = createOrderContent(contentWrapper)

    // create text **********************************************/
    const createElementText = (data) => {
        const wr = document.createElement('div')
        const contentId = data ? data.contentId : Math.floor(Math.random() * 1000) + '_contentId'
        orderContent.addElem({ contentId, dom: wr })
        
        drawInput(wr, 'text', data ? data.html : '', 'content text').addEventListener('change', e => {
            let current = null
            for (let i = 0; i < nodeData.content.length; i++) {
                if (nodeData.content[i].contentId === contentId) {
                    current = nodeData.content[i]
                }
            }
            const newDataCandidate = { contentId, type: 'text', html: e.target.value }
            if (current) {
                current.newDataCandidate = newDataCandidate
            } else {
                nodeData.content.push({ 
                    contentId, 
                    newDataCandidate: { 
                        contentId, 
                        type: 'text', 
                        html: e.target.value 
                    } 
                })
            }
        })
        drawEmptyLine(wr, 1)
        drawElem('button', wr, '✖️').addEventListener('click', () => {
            orderContent.destroyElem(contentId)
            nodeData.content = nodeData.content.filter(item => item.contentId !== contentId)
        })
        drawElem('button', wr, '🔼').addEventListener('click', () => {
            orderContent.moveTop(contentId)
        })
        drawElem('button', wr, '🔽').addEventListener('click', () => {
            orderContent.moveBottom(contentId)
        })
        drawEmptyLine(wr, 10)
    }

    /** create content image **************************************/
    const createElementImage = (existContentElem = null) => {
        const wr = document.createElement('div')
        const contentId = existContentElem ? existContentElem.contentId : Math.floor(Math.random() * 1000) + '_contentId';
        orderContent.addElem({ contentId, dom: wr })

        const S = 50
        const showImage = drawElem('img', wr)
        showImage.style.width = S + 'px'
        showImage.style.height = S + 'px'
        if (existContentElem && existContentElem.src) {
            showImage.src = existContentElem.src
        }
      
        const imgInput = drawInput(wr, 'file')
        imgInput.accept = 'image/*';
        imgInput.addEventListener('change', e => {
            const file = e.target.files[0]
            if (!file) return;
            const reader = new FileReader()
            reader.addEventListener('load', (e) => {
                showImage.src = e.target.result
            })
            reader.readAsDataURL(file)
      
            const fileName = getFormattedDate() + '_c.jpg'
            const formData = new FormData()
            formData.append('file', file, fileName)

            const newDataCandidate = {
                contentId, 
                type: 'img', 
                src: './images/' + fileName, 
                fileName, 
                formData, 
            }

            if (existContentElem) {
                existContentElem.newDataCandidate = newDataCandidate
            } else {
                nodeData.content.push({ 
                    contentId, 
                    newDataCandidate, 
                }) 
            }    
        })
        drawEmptyLine(wr, 1)
        drawElem('button', wr, '✖️').addEventListener('click', async () => {
            const isOk = await drawAlert()
            if (!isOk) return;
            if (existContentElem) {
                existContentElem.newDataCandidate = { contentId, message: 'mustDelete', type: 'img' }
            } else {
                nodeData.content = nodeData.content.filter(item => item.contentId !== contentId)
            } 
            wr.innerHTML = ''
            contentWrapper.removeChild(wr)
        })
        drawElem('button', wr, '🔼').addEventListener('click', () => {
            orderContent.moveTop(contentId)
        })
        drawElem('button', wr, '🔽').addEventListener('click', () => {
            orderContent.moveBottom(contentId)
        })
        drawEmptyLine(wr, 10)
    }

    for (let i = 0; i < nodeData.content.length; i++) {
        if (nodeData.content[i].type === 'text') {
            createElementText(nodeData.content[i])
        }
        if (nodeData.content[i].type === 'img') {
            createElementImage(nodeData.content[i])
        }
    }

    drawEmptyLine(wrapper)
    drawElem('button', wrapper, 'add ✍️').addEventListener('click', () => createElementText())
    drawElem('button', wrapper, 'add 🖼').addEventListener('click', () => createElementImage())
    drawEmptyLine(wrapper)

    // save *******************************************************/
    const tryDeleteImageFromServerByPath = async (path) => {
        const name = path.split('/').pop()
        try {
            await deleteFileFromServer(name)
        } catch (error) {
            console.log('error', error)
        }
    } 

    drawElem('button', wrapper, '✅✅✅✅✅✅').addEventListener('click', async () => {
        if (nodeData.preview.imageCandidate) {
            // if delete previewImage ////////////////////////////////////////
            if (nodeData.preview.imageCandidate.message === "mustDelete") {
                if (nodeData.preview.imgSrc) {
                    await tryDeleteImageFromServerByPath(nodeData.preview.imgSrc)
                }
                delete nodeData.preview.imgSrc
                delete nodeData.preview.imageCandidate
            }
            // if change previewImage to another /////////////////////////////
            if (nodeData.preview.imageCandidate && nodeData.preview.imageCandidate.canvasPreview) {
                if (nodeData.preview.imgSrc) {
                    await tryDeleteImageFromServerByPath(nodeData.preview.imgSrc)
                }

                const convertImg = (canvas) => {
                    return new Promise(res => {
                        canvas.toBlob((blob) => { res(blob) }, 'image/jpeg', 1)
                    })
                }
                const fileName = getFormattedDate() + '_pr.jpg'
                const blob = await convertImg(nodeData.preview.imageCandidate.canvasPreview)
                const formData = new FormData()
                formData.append('file', blob, fileName)
                const resultPost = await postFileToServer(formData)
                if (resultPost === 'upload successful') {
                    nodeData.preview.imgSrc = './images/' + fileName
                    delete nodeData.preview.imageCandidate
                }
            }
        }
        // change node content ////////////////////////////////
        for (let i = 0; i < nodeData.content.length; i++) {
            const contentItem = nodeData.content[i]
            if (!contentItem.newDataCandidate) {
                continue; 
            }
            if (contentItem.newDataCandidate.type === 'text') {
                nodeData.content[i] = contentItem.newDataCandidate
            }

            if (contentItem.newDataCandidate.type === 'img') { 
                if (contentItem.src) {
                    await tryDeleteImageFromServerByPath(contentItem.src)
                }
                const { formData, message } = contentItem.newDataCandidate
                if (message === 'mustDelete') {
                    nodeData.content.splice(i, 1)
                    --i
                } else {
                    const resultPost = await postFileToServer(formData)
                    if (resultPost === 'upload successful') {
                        nodeData.content[i] = contentItem.newDataCandidate
                        delete nodeData.content[i].formData
                    }
                }
            }
        }
        const order = orderContent.getOrder()
        const arr = []
        for (let i = 0; i < order.length; ++i) {
            const contentId = order[i]
            for (let j = 0; j < nodeData.content.length; ++j) {
                if (nodeData.content[j].contentId !== contentId) continue;
                arr.push(nodeData.content[j])
            }
        }
        nodeData.content = arr

        if (!nodeId) {
            appData.nodes.splice(0, 0, nodeData)
        } else {
            let index = null
            for (let i = 0; i < appData.nodes.length; i++) {
                if (appData.nodes[i].id === nodeId) {
                    index = i
                }
            }
            appData.nodes[index] = nodeData
        }
        await postDataToServer(appData)
        document.querySelector('.edit-node').innerHTML = ''
        redirectToAndDrawPage('node', nodeData.id)
    })
}

document.addEventListener('DOMContentLoaded', async () => { 
    await redirectToAndDrawPage()
    document.querySelector('.add-new-node').addEventListener('click', () => formsEditNode(null)) 
})

window.addEventListener('popstate', (event) => {
    redirectToAndDrawPage()
})