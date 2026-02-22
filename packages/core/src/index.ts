export type NavEntry = {
    path: string
    title?: string
    isHidden?: boolean
    component?: unknown
}

export type NavNode = {
    entry: NavEntry
    children: NavEntry[]
}

type Listener = () => void

export class EaseNav {
    private entries: NavEntry[] = []
    private listeners: Set<Listener> = new Set()
    private cachedVisible: NavEntry[] = []
    private cachedAll: NavEntry[] = []
    private cachedTree: NavNode[] = []

    register(entry: NavEntry): EaseNav {
        entry.title = entry.title ?? this.titleFromPath(entry.path)
        const existingIdx = this.entries.findIndex(e => e.path === entry.path)
        if (existingIdx !== -1) {
            this.entries[existingIdx] = entry
        } else {
            this.entries.push(entry)
        }
        this.updateSnapshots()
        return this
    }

    unregister(path: string): EaseNav {
        this.entries = this.entries.filter(e => e.path !== path)
        this.updateSnapshots()
        this.notify()
        return this
    }

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    toggleHidden(path: string): void {
        const entry = this.entries.find(e => e.path === path)
        if (entry) {
            entry.isHidden = !entry.isHidden
            this.notify()
        }
    }

    move(path: string, direction: "up" | "down"): void {
        const idx = this.entries.findIndex(e => e.path === path)
        if (idx === -1) return
        const swapIdx = direction === "up" ? idx - 1 : idx + 1
        const a = this.entries[idx]
        const b = this.entries[swapIdx]
        if (!a || !b) return
        this.entries[idx] = b
        this.entries[swapIdx] = a
        this.notify()
    }

    getByPath(path: string): NavEntry | undefined {
        return this.entries.find(entry => entry.path === path)
    }

    getEntries = (): NavEntry[] => {
        return this.cachedVisible
    }

    getAllEntries = (): NavEntry[] => {
        return this.cachedAll
    }

    getTree = (): NavNode[] => {
        return this.cachedTree
    }

    get size(): number {
        return this.entries.length
    }

    private updateSnapshots() {
        this.cachedVisible = this.entries
            .filter(entry => entry.isHidden !== true)
            .filter(entry => entry.path !== "*")
        this.cachedAll = [...this.entries]
        this.cachedTree = this.buildTree(this.cachedVisible)
    }

    private buildTree(entries: NavEntry[]): NavNode[] {
        const topLevel: NavNode[] = []
        const childMap = new Map<string, NavEntry[]>()

        for (const entry of entries) {
            const segments = entry.path.replace(/^\//, "").split("/")
            if (segments.length <= 1) {
                topLevel.push({ entry, children: [] })
            } else {
                const parentPath = `/${segments[0]}`
                const list = childMap.get(parentPath) ?? []
                list.push(entry)
                childMap.set(parentPath, list)
            }
        }

        for (const node of topLevel) {
            node.children = childMap.get(node.entry.path) ?? []
        }

        return topLevel
    }

    private notify() {
        this.updateSnapshots()
        for (const listener of this.listeners) listener()
    }

    private titleFromPath(path: string): string {
        if (path === "/") return "Home"
        const segment = path.replace(/^\//, "").split("/").pop() ?? path
        return segment
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase())
    }
}
