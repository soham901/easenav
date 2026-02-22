export const mockCore = (): string => "core setup works";

type NavEntry = {
    path: string
    title?: string
    index?: number
    isHidden?: boolean
    component?: React.ComponentType
}

type NavState = {
    entries: NavEntry[]
}

type Listener = () => void

export class EaseNav {
    private state: NavState = {entries: []}
    private listeners: Set<Listener> = new Set()
    private cachedVisible: NavEntry[] = []
    private cachedAll: NavEntry[] = []

    register(entry: NavEntry): EaseNav {
        console.debug(`Registering ${entry.path}`)
        entry.index = entry.index ?? this.state.entries.length
        entry.title = entry.title ?? entry.component?.name ?? String(entry.path.replaceAll("/", " "))
        if (this.state.entries.find(e => e.path === entry.path)) {
            console.warn(`NavEntry already registered: ${entry.path}, overwriting`)
            this.state.entries = this.state.entries.filter(e => e.path !== entry.path) // remove existing entry
        }
        this.state.entries.push(entry)
        this.updateSnapshots()
        return this
    }

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    private updateSnapshots() {
        this.cachedVisible = this.state.entries
            .filter(entry => entry.isHidden !== true)
            .filter(entry => entry.path !== "*")
        this.cachedAll = [...this.state.entries]
    }

    private notify() {
        this.updateSnapshots()
        for (const listener of this.listeners) listener()
    }

    toggleHidden(path: string): void {
        const entry = this.state.entries.find(e => e.path === path)
        if (entry) {
            entry.isHidden = !entry.isHidden
            this.notify()
        }
    }

    move(path: string, direction: "up" | "down"): void {
        const idx = this.state.entries.findIndex(e => e.path === path)
        if (idx === -1) return
        const swapIdx = direction === "up" ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= this.state.entries.length) return
        const entries = this.state.entries;
        [entries[idx], entries[swapIdx]] = [entries[swapIdx], entries[idx]]
        this.notify()
    }

    getByPath(path: string): NavEntry | undefined {
        return this.state.entries.find(entry => entry.path === path)
    }

    getEntries = (): NavEntry[] => {
        return this.cachedVisible
    }

    getAllEntries = (): NavEntry[] => {
        return this.cachedAll
    }

    _debugState(): NavState {
        return this.state
    }
}
