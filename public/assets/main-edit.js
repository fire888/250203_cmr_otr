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
const postFileToServer = (data) => {
    return new Promise((resolve, reject) => {
        fetch(url + '/api/upload-image', {
            method: 'POST',
            body: data
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json(); // or response.text(), depending on server response
          })
          .then(data => {
            resolve(data)
          })
          .catch(error => {
            console.error('Upload error:', error);
            alert('Upload failed!');
          });
    })
}
const deleteFileFromServer = async (fileName) => {
    const response = await fetch(url + '/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName })
    });
    if (!response.ok) {
      throw new Error('Network response was not ok: ' + response.status);
    }
    return 'Delete successful';
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

/** elements node ******************************** */

const drawEmptyLine = (wrapper, h = 30) => {
    const elem = document.createElement('div')
    elem.style.minHeight = h + 'px'
    wrapper.appendChild(elem)
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
/** node ********************************** */
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
        try {
            await drawImage(imgSrc, el) 
        } catch (error) {
            console.error(error)
        }
    }
    if (text) {
        drawText(text, el)
    }
    el.addEventListener('click', () => {
        redirectToAndDrawPage('node', nodeId)
    })
}
const drawNode = async (nodeId) => {
    const addNewNodeButton = document.querySelector('.add-new-node')
    addNewNodeButton.style.display = 'none'  

    const node = appData.nodes.find(node => node.id === nodeId)
    if (!node) {
        console.log('node not found:' + nodeId)
        return;
    }
    if (!node.isPublished) {
        return;     
    }

    const wrapper = document.querySelector('.content')

    const data = document.createElement('div')
    data.classList.add('code')
    data.innerHTML = JSON.stringify(node, null, 2) // node
    wrapper.appendChild(data)

    const edit = document.createElement('button')
    edit.innerHTML = 'edit'
    wrapper.appendChild(edit)
    edit.addEventListener('click', async () => {
        wrapper.removeChild(edit)
        formsEditNode(nodeId)
    })
    const del = document.createElement('button')
    del.innerHTML = 'delete'
    wrapper.appendChild(del)
    del.addEventListener('click', async () => {
        appData.nodes = appData.nodes.filter(n => n.id !== nodeId)
        await postDataToServer(appData)
        redirectToAndDrawPage()
    })

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
/** list ********************************************************** */
const drawList = async (listId) => {
    const addNewNodeButton = document.querySelector('.add-new-node')
    addNewNodeButton.style.display = 'block'  

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
        await drawPreviewNode(nodes[i].id) 
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
    if (!params.nodeId && !params.listId) {
        await drawList(null)
    }
    if (params.nodeId) {
        await drawNode(params.nodeId)
    }
    if (params.listId) {
        await drawList(params.listId)
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

    const close = document.createElement('button')
    close.innerText = 'cancel'
    close.addEventListener('click', () => {
        nodeId 
            ? redirectToAndDrawPage('node', nodeId) 
            : redirectToAndDrawPage()
    })
    wrapper.appendChild(close)
    drawEmptyLine(wrapper)

    const title = document.createElement('input')
    title.type = 'text'
    title.placeholder = 'title'
    title.value = nodeData.title
    title.addEventListener('change', () => {
        nodeData.title = title.value
    })
    wrapper.appendChild(title)

    const raiting = document.createElement('input')
    raiting.type = 'text'
    raiting.placeholder = 'raiting'
    raiting.value = nodeData.raiting
    raiting.addEventListener('change', () => {
        nodeData.raiting = raiting.value
    })
    wrapper.appendChild(raiting)

    const wrIsPublished = document.createElement('div')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = nodeData.isPublished
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
    previewText.value = nodeData.preview.text
    previewText.addEventListener('change', () => {
        nodeData.preview.text = previewText.value
    })
    wrapper.appendChild(previewText)
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
    const remove = document.createElement('button')
    remove.innerText = 'delete'
    remove.addEventListener('click', () => {
        showImage.removeAttribute("src");
        if (nodeData.preview.imageCandidate) {
            nodeData.preview.imageCandidate.message = "mustDelete" 
        } else {
            nodeData.preview.imageCandidate = { message: "mustDelete" }
        }
    })
    wrapper.appendChild(remove)
    drawEmptyLine(wrapper)


    // tags *****************************************************/
    let tagsSet = new Set()
    if (nodeData.tags) {
        tagsSet = new Set(nodeData.tags)
    }
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
                tagsSet.delete(value)
                t.removeChild(v)
                t.removeChild(remove)
                nodeData.tags = [...tagsSet ]
            })
            t.appendChild(remove)
        }
    }
    addTagList()
    
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
    drawEmptyLine(wrapper)


    /** CONTENT ********************************************/ 
    /** ****************************************************/ 

    // order content node for move bottom/top
    const contentWrapper = document.createElement('div')
    wrapper.appendChild(contentWrapper)
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
    const orderContent = createOrderContent(contentWrapper)

    // create text **********************************************/
    const createElementText = (data) => {
        const wr = document.createElement('div')
        const contentId = data ? data.contentId : Math.floor(Math.random() * 1000) + '_contentId'
        orderContent.addElem({ contentId, dom: wr })
        
        const txt = document.createElement('input')
        txt.type = 'text'
        txt.placeholder = 'content text'
        txt.value = data ? data.html : ''
        txt.addEventListener('change', () => {
            let current = null
            for (let i = 0; i < nodeData.content.length; i++) {
                if (nodeData.content[i].contentId === contentId) {
                    current = nodeData.content[i]
                }
            }
            const newDataCandidate = { contentId, type: 'text', html: txt.value }
            if (current) {
                current.newDataCandidate = newDataCandidate
            } else {
                nodeData.content.push({ 
                    contentId, 
                    newDataCandidate: { 
                        contentId, 
                        type: 'text', 
                        html: txt.value 
                    } 
                })
            }
        })
        wr.appendChild(txt)

        const remove = document.createElement('button')
        remove.innerText = 'remove'
        remove.addEventListener('click', () => {
            orderContent.destroyElem(contentId)

            nodeData.content = nodeData.content.filter(item => item.contentId !== contentId)
        })
        wr.appendChild(remove)
        const moveTop = document.createElement('button')
        moveTop.innerText = 'moveTop'
        moveTop.addEventListener('click', () => {
            orderContent.moveTop(contentId)
        })
        wr.appendChild(moveTop)
        const moveBottom = document.createElement('button')
        moveBottom.innerText = 'moveBottom'
        moveBottom.addEventListener('click', () => {
            orderContent.moveBottom(contentId)
        })
        wr.appendChild(moveBottom)
    }

    /** create content image **************************************/
    const createElementImage = (existContentElem = null) => {
        const wr = document.createElement('div');
        const contentId = existContentElem ? existContentElem.contentId : Math.floor(Math.random() * 1000) + '_contentId';
        orderContent.addElem({ contentId, dom: wr })

        const S = 50
        const showImage = document.createElement('img')
        showImage.style.width = S + 'px'
        showImage.style.height = S + 'px'
        if (existContentElem && existContentElem.src) {
            showImage.src = existContentElem.src
        }
        wr.appendChild(showImage);
      
        // Create the file input (only accept images)
        const imgInput = document.createElement('input');
        imgInput.type = 'file';
        imgInput.accept = 'image/*';
        imgInput.addEventListener('change', () => {
            const file = imgInput.files[0]
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
        wr.appendChild(imgInput)
        const remove = document.createElement('button')
        remove.innerText = 'remove'
        remove.addEventListener('click', () => {
            if (existContentElem) {
                existContentElem.newDataCandidate = { contentId, message: 'mustDelete', type: 'img' }
            } else {
                nodeData.content = nodeData.content.filter(item => item.contentId !== contentId)
            } 
            wr.innerHTML = ''
            contentWrapper.removeChild(wr)
        })
        wr.appendChild(remove)
        const moveTop = document.createElement('button')
        moveTop.innerText = 'moveTop'
        moveTop.addEventListener('click', () => {
            orderContent.moveTop(contentId)
        })
        wr.appendChild(moveTop)
        const moveBottom = document.createElement('button')
        moveBottom.innerText = 'moveBottom'
        moveBottom.addEventListener('click', () => {
            orderContent.moveBottom(contentId)
        })
        wr.appendChild(moveBottom)
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

    const createButtAddText = document.createElement('button')
    createButtAddText.innerText = 'add content text'
    createButtAddText.addEventListener('click', () => createElementText())
    wrapper.appendChild(createButtAddText)

    const createContentImage = document.createElement('button')
    createContentImage.innerText = 'add content image'
    createContentImage.addEventListener('click', () => createElementImage())
    wrapper.appendChild(createContentImage)

    drawEmptyLine(wrapper)

    // save *******************************************************/
    const save = document.createElement('button')
    save.innerText = 'save'
    save.addEventListener('click', async () => {
        if (nodeData.preview.imageCandidate) {
            if (nodeData.preview.imageCandidate.message === "mustDelete") {
                if (nodeData.preview.imgSrc) {
                    const name = nodeData.preview.imgSrc.split('/').pop()
                    try {
                        const result = await deleteFileFromServer(name)
                    } catch (error) {
                        console.log('error', error)
                    }
                }
                delete nodeData.preview.imgSrc
                delete nodeData.preview.imageCandidate
            }

            if (
                nodeData.preview.imageCandidate && 
                nodeData.preview.imageCandidate.canvasPreview
            ) {
                if (nodeData.preview.imgSrc) {
                    const name = nodeData.preview.imgSrc.split('/').pop()
                    try {
                        const result = await deleteFileFromServer(name)
                    } catch (error) {
                        console.log('error', error)
                    }
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
                if (resultPost && resultPost.file && resultPost.file.filename && resultPost.file.filename === fileName) {
                    nodeData.preview.imgSrc = './images/' + fileName
                    delete nodeData.preview.imageCandidate
                }
            }
        }

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
                    const name = contentItem.src.split('/').pop()
                    try {
                        const result = await deleteFileFromServer(name)
                    } catch (error) {
                        console.log('error', error)
                    }
                }

                const { contentId, formData, fileName, message } = contentItem.newDataCandidate
                if (message === 'mustDelete') {
                    nodeData.content.splice(i, 1)
                    --i
                } else {
                    const resultPost = await postFileToServer(formData)
                    nodeData.content[i] = contentItem.newDataCandidate
                    delete nodeData.content[i].formData
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
    wrapper.appendChild(save)
}

document.addEventListener('DOMContentLoaded', async () => { 
    await redirectToAndDrawPage()
    document.querySelector('.add-new-node').addEventListener('click', () => formsEditNode(null)) 
})

window.addEventListener('popstate', (event) => {
    redirectToAndDrawPage()
})