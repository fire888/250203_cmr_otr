(() => {
  /*********** Глобальные переменные и состояния *****************************/
  const START_TAG = 'code'
  const NUM_NODES_IN_LIST = 20
  const OFFSET_W = 5
  let w, h, minKey
  let appData = null
  const contentWrapper = document.querySelector('.content')
  const PATH_TO_DATA = './index-assets/content/0_content.json'
  const HISTORY_WINDOW = []
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

  const breakerListDraw = (() => { 
    let promiseToComplete = null
    let isUpdateInProcess = false
    return {
      waitDropLoadingPrevious: () => {
        return new Promise((resolve) => {
          if (!isUpdateInProcess) {
            return resolve()
          }
          promiseToComplete = resolve 
        })
      },
      setIsUpdateInProcess: (value) => { isUpdateInProcess = value },
      checkIsMustBreak: () => {
        return !!promiseToComplete
      },
      completeBreak: () => {
        if (!promiseToComplete) {
          return;
        }
        promiseToComplete()
        promiseToComplete = null
      } 
    } 
  })()

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
    return {
      nodeId: urlParams.get('node') || null,
      listId: urlParams.get('list') || null,
      page: urlParams.get('page') || null,
    }
  }

  /*********** Рисование элементов  ******************************************/

  const clearContent = () => {
    contentWrapper.innerHTML = ''
    window.scrollTo(0, 0)
  }

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
        redirectToAndDrawPage('node', nodeId)
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
        redirectToAndDrawPage('list', tag, i)
      })
    }
  }

  const drawList = async (listId, pageNum = 0) => {
    const nodes = appData.nodes
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
        if (breakerListDraw.checkIsMustBreak()) return;
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

  const redrawMainMenu = (navId) => {
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
      link.id === navId 
        ? link.classList.add('current') 
        : link.classList.remove('current')
    })
  }

  /*********** Основная логика ***********************************************/

  const redirectToAndDrawPage = async (type = 'list', id = START_TAG, pageNum = 0, isPushState = true) => {
    // wait loading prev view 
    await breakerListDraw.waitDropLoadingPrevious()
    breakerListDraw.setIsUpdateInProcess(true)
    clearContent()
    if (isPushState) { 
      HISTORY_WINDOW.push({ type, id, page: pageNum })
      window.history.pushState({ type, id, page: pageNum }, '', `?${type}=${id}&page=${pageNum}`)
    } else {
      window.history.replaceState({ type, id, page: pageNum }, '', `?${type}=${id}&page=${pageNum}`)
    }
    const { nodeId, listId, page } = parseUrlParams()
    if (nodeId) {
        await drawNode(nodeId)
    }
    let domNavId = null
    for (let key in NAV) {
      if (NAV[key].id === id && NAV[key].type === type) {
        domNavId = key
      }
    }
    if (domNavId) {
        redrawMainMenu(domNavId)
    }
    if (listId) {    
        await drawList(listId, page)
    }
    // clear blocker for new loading if it exists
    breakerListDraw.setIsUpdateInProcess(false)
    breakerListDraw.completeBreak()
  }

  window.addEventListener('popstate', async () => {
    const last = HISTORY_WINDOW[HISTORY_WINDOW.length - 2]
    HISTORY_WINDOW.splice(HISTORY_WINDOW.length - 1, 1)
    if (!last) return;
    await redirectToAndDrawPage(last.type || 'list', last.id || START_TAG, last.page || 0, false) 
  })

  document.addEventListener('DOMContentLoaded', async () => {
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
      link.addEventListener('click', () => {
        redirectToAndDrawPage(NAV[link.id].type, NAV[link.id].id, 0)
      })
    })

    appData = await loadJson(PATH_TO_DATA)

    redirectToAndDrawPage()
  })
})()