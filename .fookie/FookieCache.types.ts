export interface FookieCacheCreateBody {
    model: string
    hash: string
    data: string
}

export interface FookieCacheQuery {
    offset?: number
    limit?: number
    filter?: {
        id?: { equals: string; not: string; in: string[]; not_in: string[]; contains: string }
        model?: { equals: string; not: string; in: string[]; not_in: string[]; contains: string }
        hash?: { equals: string; not: string; in: string[]; not_in: string[]; contains: string }
        data?: { equals: string; not: string; in: string[]; not_in: string[]; contains: string }
    }
}

export interface FookieCacheEntity {
    id: string
    model: string
    hash: string
    data: string
}

export interface FookieCacheUpdateBody {
    model?: string
    hash?: string
    data?: string
}
