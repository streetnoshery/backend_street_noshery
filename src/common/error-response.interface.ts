export interface ICustomErrorResponse {
    state: "FAILURE",
    status: number,
    statusText: string,
    source: string,
    data: any,
    path: string
}