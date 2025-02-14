(() => {
  /*********** Глобальные переменные и состояния *****************************/

  const START_TAG = 'code'
  const NUM_NODES_IN_LIST = 24
  const OFFSET_W = 5
  let w, h, minKey
  let appData = null
  const contentWrapper = document.querySelector('.content')
  const PATH_TO_DATA = './index-assets/content/0_content.json'
  const NAV = {
    'code': { type: 'list', id: 'code', },
    'zbrush': { type: 'list', id: 'zbrush', },
    'design': { type: 'list', id: 'design', },
    'art': { type: 'list', id: 'art', },
    'me': { type: 'node', id: '880109_' },
  }

  const updateDimensions = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    minKey = w < h ? 'w' : 'h'
  }
  updateDimensions()
  window.addEventListener('resize', updateDimensions)

  /*********** Утилиты *******************************************************/

  const loadJson = async (url) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Network response was not OK: ${response.status}`);
      }
      return await response.json()
    } catch (error) {
      console.error('Fetch error:', error)
      return null
    }
  }

  const parseUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    let type = null
    let id = null
    if (urlParams.get('node')) { 
      type = 'node'
      id = urlParams.get('node')
    }
    if (urlParams.get('list')) { 
      type = 'list'
      id = urlParams.get('list')
    }
    return { type, id, page: urlParams.get('page') || null }
  }

  /*********** Рисование элементов  ******************************************/

  const drawElem = (wrapper, type, text, className) => {
    const elem = document.createElement(type)
    wrapper.appendChild(elem)
    text && (elem.innerText = text)
    className && elem.classList.add(className)
    return elem 
  }

  const drawImage = async (src, wrapper) => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        wrapper.appendChild(img)
        resolve()
      }
      img.src = src
    })
  }

  const drawImageSizeScreen = async (src, wrapper) => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      if (minKey === 'w') {
        img.style.width = (w - OFFSET_W) + 'px'
        img.style.height = 'auto'
      } else {
        img.style.height = (h - OFFSET_W) + 'px'
        img.style.width = 'auto'
      }
      img.onload = () => {
        wrapper.appendChild(img)
        resolve()
      }
      img.src = src
    })
  }

  const drawText = (text, wrapper, size = 16) => {
    const p = document.createElement('p')
    p.innerHTML = text
    p.style.fontSize = `${size}px`
    wrapper.appendChild(p)
  }

  const drawEmptyLine = (wrapper, h = 30) => {
    const elem = document.createElement('div')
    elem.style.minHeight = h + 'px'
    wrapper.appendChild(elem)
  }

  /*********** Рисование контейнеров *****************************************/

  const drawPreviewNode = async (nodeId, parent) => {
    const node = appData.nodes.find((n) => n.id === nodeId)
    if (!node || !node.isPublished) return;

    const el = drawElem(parent, 'div', null, 'view-list-item')
    el.addEventListener('click', () => {
      window.location.href = `?node=${nodeId}`
    })
    const { imgSrc, text } = node.preview
    if (imgSrc) {
      await drawImage(imgSrc, el)
    }
    if (text) {
      drawText(text, el)
    }
  }

  const drawNode = async (nodeId) => {
    const node = appData.nodes.find((n) => n.id === nodeId)
    if (!node || !node.isPublished || !node.content) {
      console.warn('Node not found or not published:', nodeId)
      return;
    }
    for (const block of node.content) {
      if (block.type === 'img') {
        await drawImageSizeScreen(block.src, contentWrapper)
      } else if (block.type === 'text') {
        drawText(block.html, contentWrapper, block.size);
      }
    }
  }

  const drawPager = (wrapper, countItems, index, numPerPage, tag) => {
    const n = Math.ceil(countItems / numPerPage)
    if (n < 2) return;
    drawEmptyLine(wrapper, 40)
    const wr = drawElem(wrapper, 'div', null, 'pager')
    for (let i = 0; i < n; ++i) {
      const a = drawElem(wr, 'a', +index === i ? '[' + i + ']' : i + '')
      if (+index !== i) a.addEventListener('click', () => {
        window.location.href = `?list=${tag}&page=${i}`
      })
    }
  }

  const drawList = async (listId, pageNum = 0) => {    
    const nodes = appData.nodes
      .filter((n) => n.isPublished)
      .filter((n) => n.tags?.includes(listId))
      .sort((a, b) => b.raiting - a.raiting)
  
    const startIndex = pageNum * NUM_NODES_IN_LIST
    const endIndex = startIndex + NUM_NODES_IN_LIST

    if (listId === 'code' || listId === 'design') {
      const viewList = drawElem(contentWrapper, 'div', null, 'view-list')
      for (let i = startIndex; i < endIndex; ++i) {
        if (!nodes[i]) break;
        await drawPreviewNode(nodes[i].id, viewList)
      }
    } else {
      for (let i = startIndex; i < endIndex; ++i) {
        if (!nodes[i]) break;
        const node = nodes[i]
        if (node.content[0] && node.content[0].type === 'img') {
          await drawImageSizeScreen(node.content[0].src, contentWrapper)
        }
        if (node.content[1] && node.content[1].type === 'text') {
          drawText(node.content[1].html, contentWrapper)
        }
      }
    }
    drawPager(contentWrapper, nodes.length, pageNum, NUM_NODES_IN_LIST, listId)
  }

  const redrawMainMenu = (type, id) => {
    let domNavId = null
    for (let key in NAV) {
      if (NAV[key].id === id && NAV[key].type === type) {
        domNavId = key
      }
    }
    if (!domNavId) return;
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
      link.id === domNavId 
        ? link.classList.add('current') 
        : link.classList.remove('current')
    })
  }

  /*********** Основная логика ***********************************************/

  const footer = document.querySelector('.footer') 
  const loader = drawElem(footer, 'div', null, 'loader-spin')

  document.addEventListener('DOMContentLoaded', async () => {
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
      link.addEventListener('click', () => {
        window.location.href = `?${NAV[link.id].type}=${NAV[link.id].id}`
      })
    })

    appData = await loadJson(PATH_TO_DATA)

    let { page, type, id } = parseUrlParams()
    if (!page) page = 0
    if (!type) type = 'list'
    if (!id) id = 'code'

    redrawMainMenu(type, id)
    if (type === 'node') {
      await drawNode(id)
    }
    if (type === 'list') {   
        await drawList(id, page)
    }
    footer.removeChild(loader)
  })
})()