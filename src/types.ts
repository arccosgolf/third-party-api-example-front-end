export type TokenResponseBody = {
    access_token: string
    id_token?: string
    refresh_token?: string
}

export type IdTokenPayload = {
    "sub": string
    "custom:arccosUserId": string
    "email": string
}

export type Round = {
    roundId: number
    userId: string
    startDate: string
    endDate: string | null
    totalScore: number | null
    courseId: number
    courseVersion: number
    numberOfHoles: number
}

export type GetRoundsResponse = {
    results: Round[]
    paging: {
        limit: number
        offset: number
        previous?: string
        next?: string
    }
}
