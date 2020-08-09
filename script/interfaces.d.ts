interface TODO {

}

interface FilterRow extends HTMLElement {
    fromWild: HTMLButtonElement
    toWild: HTMLButtonElement
    from: HTMLInputElement
    to: HTMLInputElement
    track: HTMLInputElement
    filter: HTMLSelectElement
    add: HTMLButtonElement
    del: HTMLButtonElement

    currentFilter: Filter
}

interface ActionRow extends HTMLElement {
    color: HTMLInputElement
    block: HTMLSelectElement
    request: HTMLInputElement
    response: HTMLInputElement
    delete: HTMLButtonElement
}

interface BackgroundPage {
    settings: Settings

    setSync(type: string): void
    syncUpdateSettings(): void

    filters: Filters
    getFilter(referer: string, domain: string): Filter
    addFilter(filter: Filter): void
    updateFilter(f: Filter, newFilter: Filter): void
    syncUpdateFilter(filter: Filter): void
    syncDeleteFilter(f: Filter): void

    actions: Actions
    addAction(actionKey: string, action: Action): void
    deleteAction(actionKey: string): void
    syncUpdateAction(actionKey: string, action: Action): void

    saveAll(): void

    syncType: string

    logUncaught: any
    showErrors(doc: Document): void

    exportJSON(): string
    importAll(list: any): void

    getDomain(from: string): string

    TrackedRequests: TrackedRequestList
    ClearTrackedRequests(): void

    tabUrl: TabString
    tabFilters: TabFilters
    tabRequests: { [tabID: string]: TrackedRequestList }
}

interface TabFilters {
    [tabID: string]: Filter[]
}

interface TabString {
    [tabID: string]: string
}

interface TrackedRequestList {
    [index: string]: ITrackedRequest
}

interface ITrackedRequest {
    from: string
    to: string
    track?: boolean
}

interface Filters {
    wild: { [index: string]: FiltersTo }
    direct: { [index: string]: FiltersTo }
}

interface FiltersTo {
    wild: { [index: string]: Filter }
    direct: { [index: string]: Filter }
}

interface Actions {
    [index: string]: Action
    pass?: Action
    clear?: Action
    block?: Action
}

interface Action {
    color?: string
    block?: string
    request?: HeaderFilter
    response?: HeaderFilter
    sync?: string
    acceptlanguage?: TODO
    referer?: string
    agent?: string
    accept?: string
    acceptencoding?: string
    acceptcharset?: string
    csp?: string
    customcsp?: string
    cookie?: string
}

interface HeaderFilter {
    [index: string]: string
}

interface Filter {
    from: string
    to: string
    filter: string
    track: boolean
}

interface ExportItem {
    filter: string
    track?: boolean
}

interface Settings {
    ignoreWWW?: boolean
    countIndicator?: string
    defaultAction?: string
    defaultLocalAction?: string
    defaultLocalTLDAction?: string
    defaultNewFilterAction?: string
}

interface SettingsExport extends Object {
    [key: string]: any
    settings?: any
}