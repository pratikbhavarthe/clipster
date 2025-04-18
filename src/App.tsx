"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  Plus,
  Copy,
  Trash2,
  FileText,
  ImageIcon,
  Link,
  Folder,
  PlusCircle,
  X,
  Save,
  Upload,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

// Types
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

// Main component
function App() {
  // State
  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlock, setActiveBlock] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newBlockName, setNewBlockName] = useState("")
  const [newBlockIcon, setNewBlockIcon] = useState("folder")
  const [showNewBlockDialog, setShowNewBlockDialog] = useState(false)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [newLink, setNewLink] = useState({ title: "", url: "", tags: [], description: "" })
  const [newInfo, setNewInfo] = useState({ label: "", value: "", tags: [] })
  const [newFile, setNewFile] = useState({ name: "", fileType: "", dataUrl: "", tags: [], description: "" })
  const [newTag, setNewTag] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load data from storage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // In a real Chrome extension, we would use chrome.storage.local.get
        const storedBlocks = localStorage.getItem("quickLinksBlocks")
        const storedActiveBlock = localStorage.getItem("quickLinksActiveBlock")

        if (storedBlocks) {
          const parsedBlocks = JSON.parse(storedBlocks)
          setBlocks(parsedBlocks)
        } else {
          // Initialize with default blocks if empty
          const defaultBlocks: Block[] = [
            {
              id: "personal",
              name: "Personal",
              icon: "user",
              items: [],
            },
            {
              id: "professional",
              name: "Professional",
              icon: "briefcase",
              items: [],
            },
            {
              id: "documents",
              name: "Documents",
              icon: "file-text",
              items: [],
            },
          ]
          setBlocks(defaultBlocks)
          localStorage.setItem("quickLinksBlocks", JSON.stringify(defaultBlocks))
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

  // Save data to storage whenever it changes
  useEffect(() => {
    localStorage.setItem("quickLinksBlocks", JSON.stringify(blocks))
  }, [blocks])

  useEffect(() => {
    if (activeBlock) {
      localStorage.setItem("quickLinksActiveBlock", activeBlock)
    }
  }, [activeBlock])

  // Helper functions
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

  const addBlock = () => {
    if (!newBlockName) return

    const block: Block = {
      id: Date.now().toString(),
      name: newBlockName,
      icon: newBlockIcon,
      items: [],
    }

    setBlocks([...blocks, block])
    setActiveBlock(block.id)
    setNewBlockName("")
    setNewBlockIcon("folder")
    setShowNewBlockDialog(false)
    toast({
      title: "Block added",
      description: `${block.name} has been added to your blocks.`,
    })
  }

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id))
    if (activeBlock === id && blocks.length > 0) {
      setActiveBlock(blocks[0].id)
    }
    toast({
      title: "Block deleted",
      description: "The block has been removed.",
    })
  }

  const addLink = () => {
    if (!newLink.title || !newLink.url || !activeBlock) return

    const link: LinkItem = {
      id: Date.now().toString(),
      type: "link",
      title: newLink.title,
      url: newLink.url,
      tags: newLink.tags,
      description: newLink.description,
    }

    const updatedBlocks = blocks.map((block) => {
      if (block.id === activeBlock) {
        return {
          ...block,
          items: [...block.items, link],
        }
      }
      return block
    })

    setBlocks(updatedBlocks)
    setNewLink({ title: "", url: "", tags: [], description: "" })
    toast({
      title: "Link added",
      description: `${link.title} has been added.`,
    })
  }

  const addInfo = () => {
    if (!newInfo.label || !newInfo.value || !activeBlock) return

    const info: ProfileInfo = {
      id: Date.now().toString(),
      type: "info",
      label: newInfo.label,
      value: newInfo.value,
      tags: newInfo.tags,
    }

    const updatedBlocks = blocks.map((block) => {
      if (block.id === activeBlock) {
        return {
          ...block,
          items: [...block.items, info],
        }
      }
      return block
    })

    setBlocks(updatedBlocks)
    setNewInfo({ label: "", value: "", tags: [] })
    toast({
      title: "Information added",
      description: `${info.label} has been added.`,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeBlock) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string

      const fileItem: FileItem = {
        id: Date.now().toString(),
        type: "file",
        name: file.name,
        fileType: file.type,
        dataUrl: dataUrl,
        tags: newFile.tags,
        description: newFile.description,
      }

      const updatedBlocks = blocks.map((block) => {
        if (block.id === activeBlock) {
          return {
            ...block,
            items: [...block.items, fileItem],
          }
        }
        return block
      })

      setBlocks(updatedBlocks)
      setNewFile({ name: "", fileType: "", dataUrl: "", tags: [], description: "" })
      toast({
        title: "File added",
        description: `${file.name} has been added.`,
      })
    }
    reader.readAsDataURL(file)
  }

  const deleteItem = (blockId: string, itemId: string) => {
    const updatedBlocks = blocks.map((block) => {
      if (block.id === blockId) {
        return {
          ...block,
          items: block.items.filter((item) => item.id !== itemId),
        }
      }
      return block
    })

    setBlocks(updatedBlocks)
    toast({
      title: "Item deleted",
      description: "The item has been removed.",
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`,
    })
  }

  const addTag = (itemType: "link" | "info" | "file") => {
    if (!newTag) return

    if (itemType === "link") {
      setNewLink({
        ...newLink,
        tags: [...newLink.tags, newTag],
      })
    } else if (itemType === "info") {
      setNewInfo({
        ...newInfo,
        tags: [...newInfo.tags, newTag],
      })
    } else if (itemType === "file") {
      setNewFile({
        ...newFile,
        tags: [...newFile.tags, newTag],
      })
    }

    setNewTag("")
  }

  const removeTag = (itemType: "link" | "info" | "file", tagIndex: number) => {
    if (itemType === "link") {
      const updatedTags = [...newLink.tags]
      updatedTags.splice(tagIndex, 1)
      setNewLink({
        ...newLink,
        tags: updatedTags,
      })
    } else if (itemType === "info") {
      const updatedTags = [...newInfo.tags]
      updatedTags.splice(tagIndex, 1)
      setNewInfo({
        ...newInfo,
        tags: updatedTags,
      })
    } else if (itemType === "file") {
      const updatedTags = [...newFile.tags]
      updatedTags.splice(tagIndex, 1)
      setNewFile({
        ...newFile,
        tags: updatedTags,
      })
    }
  }

  // Filter items based on search query
  const getFilteredItems = () => {
    if (!activeBlock) return []

    const currentBlock = blocks.find((block) => block.id === activeBlock)
    if (!currentBlock) return []

    if (!searchQuery) return currentBlock.items

    return currentBlock.items.filter((item) => {
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

  // Render functions
  const renderItemCard = (item: LinkItem | ProfileInfo | FileItem, blockId: string) => {
    if (item.type === "link") {
      return (
        <Card key={item.id} className="mb-3">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                <CardTitle className="text-base">{item.title}</CardTitle>
              </div>
            </div>
            <CardDescription className="truncate text-xs">{item.url}</CardDescription>
            {item.description && <p className="text-sm mt-1">{item.description}</p>}
          </CardHeader>
          <CardFooter className="flex justify-between p-4 pt-2">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => deleteItem(blockId, item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(item.url, item.title)}>
                <Copy className="mr-2 h-3 w-3" /> Copy
              </Button>
            </div>
          </CardFooter>
        </Card>
      )
    } else if (item.type === "info") {
      return (
        <Card key={item.id} className="mb-3">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{item.label}</CardTitle>
            </div>
            <CardDescription className="text-sm font-medium">{item.value}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between p-4 pt-2">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => deleteItem(blockId, item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(item.value, item.label)}>
                <Copy className="mr-2 h-3 w-3" /> Copy
              </Button>
            </div>
          </CardFooter>
        </Card>
      )
    } else if (item.type === "file") {
      return (
        <Card key={item.id} className="mb-3">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <CardTitle className="text-base">{item.name}</CardTitle>
              </div>
            </div>
            {item.description && <CardDescription className="text-sm mt-1">{item.description}</CardDescription>}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {item.fileType.startsWith("image/") ? (
              <div className="w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={item.dataUrl || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-16 bg-gray-100 rounded-md flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between p-4 pt-2">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => deleteItem(blockId, item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <a
                href={item.dataUrl}
                download={item.name}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3"
              >
                <Save className="mr-2 h-3 w-3" /> Save
              </a>
            </div>
          </CardFooter>
        </Card>
      )
    }
    return null
  }

  return (
    <div className="w-[400px] h-[600px] flex flex-col bg-background">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">QuickLinks</h1>
        <p className="text-sm text-muted-foreground">Your information at your fingertips</p>

        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r overflow-y-auto p-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-sm font-medium">Blocks</h2>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowNewBlockDialog(true)}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {blocks.map((block) => (
              <Button
                key={block.id}
                variant={activeBlock === block.id ? "secondary" : "ghost"}
                className="w-full justify-start text-sm"
                onClick={() => setActiveBlock(block.id)}
              >
                {getIconComponent(block.icon)}
                <span className="ml-2">{block.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeBlock && (
            <>
              <div className="p-3 border-b flex items-center justify-between">
                <h2 className="font-medium">{blocks.find((block) => block.id === activeBlock)?.name}</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Link className="h-4 w-4 mr-2" /> Add Link
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Link</DialogTitle>
                          <DialogDescription>Add a new link to your collection</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              placeholder="GitHub Profile"
                              value={newLink.title}
                              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                              id="url"
                              placeholder="https://github.com/yourusername"
                              value={newLink.url}
                              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                              id="description"
                              placeholder="My GitHub profile"
                              value={newLink.description}
                              onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {newLink.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => removeTag("link", index)}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    addTag("link")
                                  }
                                }}
                              />
                              <Button type="button" onClick={() => addTag("link")}>
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addLink}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <FileText className="h-4 w-4 mr-2" /> Add Info
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Profile Information</DialogTitle>
                          <DialogDescription>Add personal or professional information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="label">Label</Label>
                            <Input
                              id="label"
                              placeholder="Full Name"
                              value={newInfo.label}
                              onChange={(e) => setNewInfo({ ...newInfo, label: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="value">Value</Label>
                            <Input
                              id="value"
                              placeholder="John Doe"
                              value={newInfo.value}
                              onChange={(e) => setNewInfo({ ...newInfo, value: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {newInfo.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => removeTag("info", index)}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    addTag("info")
                                  }
                                }}
                              />
                              <Button type="button" onClick={() => addTag("info")}>
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addInfo}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Upload className="h-4 w-4 mr-2" /> Upload File
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload File</DialogTitle>
                          <DialogDescription>Upload documents or images (PDF, DOCX, JPEG, PNG, etc.)</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="file">File</Label>
                            <div className="flex gap-2">
                              <Input
                                id="file"
                                type="file"
                                ref={fileInputRef}
                                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.heic,.webp"
                                onChange={handleFileUpload}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fileDescription">Description (optional)</Label>
                            <Textarea
                              id="fileDescription"
                              placeholder="Resume document"
                              value={newFile.description}
                              onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {newFile.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => removeTag("file", index)}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    addTag("file")
                                  }
                                }}
                              />
                              <Button type="button" onClick={() => addTag("file")}>
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteBlock(activeBlock)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Folder className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No items found in this block.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click the "Add" button to add links, information, or files.
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item) => renderItemCard(item, activeBlock))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Block Dialog */}
      <Dialog open={showNewBlockDialog} onOpenChange={setShowNewBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Block</DialogTitle>
            <DialogDescription>Create a new block to organize your information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="blockName">Block Name</Label>
              <Input
                id="blockName"
                placeholder="Job Applications"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blockIcon">Icon</Label>
              <Select value={newBlockIcon} onValueChange={setNewBlockIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="folder">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      <span>Folder</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="file-text">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Document</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="link">
                    <div className="flex items-center">
                      <Link className="h-4 w-4 mr-2" />
                      <span>Link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      <span>Image</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addBlock}>Create Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.heic,.webp"
        onChange={handleFileUpload}
      />
    </div>
  )
}

export default App
