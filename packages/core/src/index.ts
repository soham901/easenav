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
        if (!entry) return
        entry.isHidden = !entry.isHidden
        for (const child of this.getChildren(path)) {
            child.isHidden = entry.isHidden
        }
        this.notify()
    }

    isEffectivelyHidden(path: string): boolean {
        const entry = this.entries.find(e => e.path === path)
        if (!entry) return false
        if (entry.isHidden) return true
        const parent = this.parentPath(path)
        if (parent && parent !== "") {
            return this.isEffectivelyHidden(parent)
        }
        return false
    }

    canMove(path: string, direction: "up" | "down"): boolean {
        const parent = this.parentPath(path)
        const siblings = this.topLevelSiblings(parent)
        const sibIdx = siblings.findIndex(e => e.path === path)
        if (sibIdx === -1) return false
        return direction === "up" ? sibIdx > 0 : sibIdx < siblings.length - 1
    }

    move(path: string, direction: "up" | "down"): void {
        if (!this.canMove(path, direction)) return
        const parent = this.parentPath(path)
        const siblings = this.topLevelSiblings(parent)
        const sibIdx = siblings.findIndex(e => e.path === path)
        const swapEntry = siblings[direction === "up" ? sibIdx - 1 : sibIdx + 1]
        if (!swapEntry) return

        const blockA = this.getBlock(path)
        const blockB = this.getBlock(swapEntry.path)

        const startA = this.entries.findIndex(e => e.path === blockA[0]?.path)
        const startB = this.entries.findIndex(e => e.path === blockB[0]?.path)
        if (startA === -1 || startB === -1) return

        const minStart = Math.min(startA, startB)
        const combined = direction === "up"
            ? [...blockA, ...blockB]
            : [...blockB, ...blockA]

        this.entries.splice(minStart, blockA.length + blockB.length, ...combined)
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

    private getChildren(path: string): NavEntry[] {
        if (path === "/" || path === "*") return []
        const prefix = `${path}/`
        return this.entries.filter(e => e.path.startsWith(prefix))
    }

    private getBlock(path: string): NavEntry[] {
        return [this.entries.find(e => e.path === path), ...this.getChildren(path)]
            .filter((e): e is NavEntry => e != null)
    }

    private topLevelSiblings(parent: string): NavEntry[] {
        return this.entries.filter(e => this.parentPath(e.path) === parent)
    }

    private updateSnapshots() {
        this.cachedVisible = this.entries
            .filter(entry => !this.isEffectivelyHidden(entry.path))
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

    private parentPath(path: string): string {
        if (path === "/") return ""
        const parts = path.replace(/\/$/, "").split("/")
        parts.pop()
        const parent = parts.join("/")
        return parent === "" || parent === "/" ? "" : parent
    }

    private titleFromPath(path: string): string {
        if (path === "/") return "Home"
        const segment = path.replace(/^\//, "").split("/").pop() ?? path
        return segment
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase())
    }
}
