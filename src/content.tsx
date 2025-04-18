"use client"

import { useState, useEffect } from "react"
import ReactDOM from "react-dom/client"
import { X, Search, FileText, Link, ImageIcon, Folder } from "lucide-react"

let sidebarContainer: HTMLDivElement | null = null
let sidebarRoot: ReactDOM.Root | null = null

declare const chrome: any

chrome.runtime.onMessage.addListener((message: any) => {
  if (message.action === "toggleSidebar") {
    if (sidebarContainer) {
      closeSidebar()
    } else {
      openSidebar()
    }
  }
})

function openSidebar() {
  sidebarContainer = document.createElement("div")
  sidebarContainer.id = "quicklinks-sidebar"
  sidebarContainer.style.position = "fixed"
  sidebarContainer.style.top = "0"
  sidebarContainer.style.right = "0"
  sidebarContainer.style.width = "320px"
  sidebarContainer.style.height = "100vh"
  sidebarContainer.style.zIndex = "9999"
  sidebarContainer.style.boxShadow = "-5px 0 15px rgba(0, 0, 0, 0.1)"
  document.body.appendChild(sidebarContainer)

  sidebarRoot = ReactDOM.createRoot(sidebarContainer)
  sidebarRoot.render(<Sidebar />)
}

function closeSidebar() {
  if (sidebarRoot) {
    sidebarRoot.unmount()
    sidebarRoot = null
  }

  if (sidebarContainer && sidebarContainer.parentNode) {
    sidebarContainer.parentNode.removeChild(sidebarContainer)
    sidebarContainer = null
  }
}

interface Block {
  id: string
  name: string
  icon: string
  items: (LinkItem | ProfileInfo | FileItem)[]
}

interface LinkItem {
  id: string
  type: "link"
  title: string
  url: string
  tags: string[]
  description?: string
}

interface ProfileInfo {
  id: string
  type: "info"
  label: string
  value: string
  tags: string[]
}

interface FileItem {
  id: string
  type: "file"
  name: string
  fileType: string
  dataUrl: string
  tags: string[]
  description?: string
}

function Sidebar() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlock, setActiveBlock] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedBlocks = localStorage.getItem("quickLinksBlocks")
        const storedActiveBlock = localStorage.getItem("quickLinksActiveBlock")

        if (storedBlocks) {
          setBlocks(JSON.parse(storedBlocks))
        }

        if (storedActiveBlock) {
          setActiveBlock(storedActiveBlock)
        } else if (blocks.length > 0) {
          setActiveBlock(blocks[0].id)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    const notification = document.createElement("div")
    notification.textContent = "Copied to clipboard!"
    notification.style.position = "fixed"
    notification.style.bottom = "20px"
    notification.style.left = "50%"
    notification.style.transform = "translateX(-50%)"
    notification.style.padding = "8px 16px"
    notification.style.backgroundColor = "#4CAF50"
    notification.style.color = "white"
    notification.style.borderRadius = "4px"
    notification.style.zIndex = "10000"
    document.body.appendChild(notification)

    setTimeout(() => {
      document.body.removeChild(notification)
    }, 2000)
  }

  const getAllItems = () => {
    return blocks.flatMap((block) => block.items)
  }

  const getBlockItems = () => {
    if (!activeBlock) return []
    const block = blocks.find((b) => b.id === activeBlock)
    return block ? block.items : []
  }

  const getFilteredItems = () => {
    const items = activeTab === "all" ? getAllItems() : getBlockItems()

    if (!searchQuery) return items

    return items.filter((item) => {
      if (item.type === "link") {
        return (
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      } else if (item.type === "info") {
        return (
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      } else if (item.type === "file") {
        return (
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      }
      return false
    })
  }

  const filteredItems = getFilteredItems()

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "file-text":
        return <FileText className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "link":
        return <Link className="h-4 w-4" />
      case "folder":
        return <Folder className="h-4 w-4" />
      default:
        return <Folder className="h-4 w-4" />
    }
  }

  const [isFormPage, setIsFormPage] = useState(false)

  useEffect(() => {
    const formElements = document.querySelectorAll("form, input, textarea, select")
    setIsFormPage(formElements.length > 0)
  }, [])

  return (
    <div className="h-full bg-white flex flex-col shadow-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold">QuickLinks</h2>
        <button className="p-1 rounded hover:bg-gray-100" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-2 pl-8 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border-b">
        <div className="flex">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === "all" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Items
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === "block" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setActiveTab("block")}
          >
            Blocks
          </button>
        </div>
      </div>

      {activeTab === "block" && (
        <div className="border-b p-2">
          <div className="flex flex-wrap gap-1">
            {blocks.map((block) => (
              <button
                key={block.id}
                className={`px-2 py-1 text-xs rounded flex items-center ${
                  activeBlock === block.id ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setActiveBlock(block.id)}
              >
                {getIconComponent(block.icon)}
                <span className="ml-1">{block.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              if (item.type === "link") {
                return (
                  <div key={item.id} className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <Link className="h-4 w-4 mr-1 text-gray-500" />
                          <p className="font-medium">{item.title}</p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{item.url}</p>
                        {item.description && <p className="text-sm mt-1">{item.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className="ml-2 p-1 hover:bg-gray-200 rounded text-sm"
                        onClick={() => copyToClipboard(item.url)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )
              } else if (item.type === "info") {
                return (
                  <div key={item.id} className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium">{item.value}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className="ml-2 p-1 hover:bg-gray-200 rounded text-sm"
                        onClick={() => copyToClipboard(item.value)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )
              } else if (item.type === "file") {
                return (
                  <div key={item.id} className="p-3 border rounded hover:bg-gray-50">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-gray-500" />
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <a
                          href={item.dataUrl}
                          download={item.name}
                          className="ml-2 p-1 hover:bg-gray-200 rounded text-sm"
                        >
                          Save
                        </a>
                      </div>
                      {item.description && <p className="text-sm mt-1">{item.description}</p>}
                      {item.fileType.startsWith("image/") && (
                        <div className="mt-2 w-full h-24 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={item.dataUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </div>
        )}
      </div>

      {isFormPage && (
        <div className="p-3 border-t bg-gray-50">
          <p className="text-sm text-center text-gray-600">Form detected! Click on any item to copy it to clipboard.</p>
        </div>
      )}
    </div>
  )
}

export default {}
