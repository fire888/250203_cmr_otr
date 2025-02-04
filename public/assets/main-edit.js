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
            //console.log('Upload successful:', data);
            resolve(data)
            //alert('Upload successful!');
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
  
    console.log('HHHHH on remove', response)
    if (!response.ok) {

      throw new Error('Network response was not ok: ' + response.status);
    }
  
    const data = await response.json();
    console.log('Delete successful:', data);
    return data;
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
        console.log(key, value);
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
    if (!node.content) {
        console.log('node content not found:' + nodeId)
        return;
    }
    console.log('nodecontent', nodeId, node.content)


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

    const raiting = document.createElement('input')
    raiting.type = 'text'
    raiting.placeholder = 'raiting'
    raiting.value = nodeData.raiting
    raiting.addEventListener('change', () => {
        nodeData.raiting = raiting.value
    })
    wrapper.appendChild(raiting)

    const title = document.createElement('input')
    title.type = 'text'
    title.placeholder = 'title'
    title.value = nodeData.title
    title.addEventListener('change', () => {
        nodeData.title = title.value
    })
    wrapper.appendChild(title)

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

    // preview image *************************************************/
    const S = 250
    const showImage = document.createElement('img')
    showImage.style.width = S + 'px'
    showImage.style.height = S + 'px'
    if (nodeData.preview.imgSrc) {
        showImage.src = nodeData.preview.imgSrc
    }
    wrapper.appendChild(showImage)
    const prImgInput = document.createElement('input')
    prImgInput.type = 'file'
    prImgInput.accept = 'image/*'
    let canvasPreview = null
    prImgInput.addEventListener('change', () => {
        const file = prImgInput.files[0]
        const reader = new FileReader()
        reader.addEventListener('load', e => {
            const originalDataUrl = e.target.result
            const img = new Image()
            img.onload = () => {
              const maxWidth = S
              const scaleFactor = maxWidth / img.width
    
              canvasPreview = document.createElement('canvas');
              canvasPreview.width = maxWidth
              canvasPreview.height = img.height * scaleFactor
              const ctx = canvasPreview.getContext('2d');
              ctx.drawImage(img, 0, 0, canvasPreview.width, canvasPreview.height);
              const resizedDataUrl = canvasPreview.toDataURL('image/jpeg', 1);
              showImage.src = resizedDataUrl;
            }
            img.src = originalDataUrl
        })
        reader.readAsDataURL(file)
    })
    wrapper.appendChild(prImgInput)


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
    const createElementText = (data) => {
        const wr = document.createElement('div')
        contentWrapper.appendChild(wr)

        const contentId = data ? data.contentId : Math.floor(Math.random() * 1000) + '_contentId'
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
            wr.innerHTML = ''
            contentWrapper.removeChild(wr)
            nodeData.content = nodeData.content.filter(item => item.contentId !== contentId)
        })
        wr.appendChild(remove)
        const moveTop = document.createElement('button')
        moveTop.innerText = 'moveTop'
        moveTop.addEventListener('click', () => {
            console.log('HHH, top')
        })
        wr.appendChild(moveTop)
        const moveBottom = document.createElement('button')
        moveBottom.innerText = 'moveBottom'
        moveBottom.addEventListener('click', () => {
            console.log('HH, bottom')
        })
        wr.appendChild(moveBottom)
    }

    /** create content image **************************************/
    const createElementImage = (existContentElem = null) => {
        const wr = document.createElement('div');
        contentWrapper.appendChild(wr);

        const contentId = existContentElem ? existContentElem.contentId : Math.floor(Math.random() * 1000) + '_contentId';
    
        const S = 250;
        const showImage = document.createElement('img');
        showImage.style.width = S + 'px';
        showImage.style.height = S + 'px';
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
            console.log('HHH, top')
        })
        wr.appendChild(moveTop)
        const moveBottom = document.createElement('button')
        moveBottom.innerText = 'moveBottom'
        moveBottom.addEventListener('click', () => {
            console.log('HH, bottom')
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

    const createButtAddText = document.createElement('button')
    createButtAddText.innerText = 'add content text'
    createButtAddText.addEventListener('click', () => createElementText())
    wrapper.appendChild(createButtAddText)

    const createContentImage = document.createElement('button')
    createContentImage.innerText = 'add content image'
    createContentImage.addEventListener('click', () => createElementImage())
    wrapper.appendChild(createContentImage)

    // save *******************************************************/
    const save = document.createElement('button')
    save.innerText = 'save'
    save.addEventListener('click', async () => {
        if (canvasPreview) {
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
            const blob = await convertImg(canvasPreview)
            const formData = new FormData()
            formData.append('file', blob, fileName)
            const resultPost = await postFileToServer(formData)
            if (resultPost && resultPost.file && resultPost.file.filename && resultPost.file.filename === fileName) {
                nodeData.preview.imgSrc = './images/' + fileName
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
                    console.log('YYY')
                    nodeData.content.splice(i, 1)
                    --i
                } else {
                    const resultPost = await postFileToServer(formData)
                    nodeData.content[i] = contentItem.newDataCandidate
                    delete nodeData.content[i].formData
                }
            }
        }
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