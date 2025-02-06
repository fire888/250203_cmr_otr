(() => {
  /*********** Глобальные переменные и состояния *****************************/
  
  const NUM_NODES_IN_LIST = 20
  const OFFSET_W = 5
  let w, h, minKey
  let appData = null
  const contentWrapper = document.querySelector('.content')

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
      const viewList = drawElem(contentWrapper, 'div', null, 'viewList')
      for (let i = startIndex; i < endIndex; ++i) { 
        if (!nodes[i]) break;
        await drawPreviewNode(nodes[i].id, viewList)
      }
    } else {
      for (let i = startIndex; i < endIndex; ++i) {
        if (!nodes[i]) break;
        const node = nodes[i]
        let isImg = false
        let isText = false
        if (node.content[0] && node.content[0].type === 'img') {
          await drawImageSizeScreen(node.content[0].src, contentWrapper)
          isImg = true
        }
        if (node.content[1] && node.content[1].type === 'text') {
          drawText(node.content[1].html, contentWrapper)
          isText = true
        }
      }
    }
    drawPager(contentWrapper, nodes.length, pageNum, NUM_NODES_IN_LIST, listId)
  }

  const redrawMainMenu = (listId) => {
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
      link.id === listId 
        ? link.classList.add('current') 
        : link.classList.remove('current')
    })
  }

  /*********** Основная логика ***********************************************/

  const redirectToAndDrawPage = async (type = 'list', id = 'zbrush', pageNum = 0) => {
    clearContent()
    window.history.pushState({ type, id, page: pageNum }, '', `?${type}=${id}&page=${pageNum}`)
    const { nodeId, listId, page } = parseUrlParams()
    if (nodeId) {
        await drawNode(nodeId)
    }
    if (listId) {
        redrawMainMenu(listId)
        await drawList(listId, page)
    }
  }

  window.addEventListener('popstate', () => {
    redirectToAndDrawPage()
  })

  document.addEventListener('DOMContentLoaded', async () => {
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
      link.addEventListener('click', () => {
        redirectToAndDrawPage('list', link.id, 0)
      })
    })

    appData = await loadJson('./index-assets/content.json')

    redirectToAndDrawPage()
  })
})()