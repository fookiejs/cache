
export interface ReadModelCreateBody {
  text: string
}

export interface ReadModelQuery {
    offset?: number
    limit?: number
    filter?: {
        
  id?: {equals:string,not:string,in:string[],not_in:string[],contains:string}
  text?: {equals:string,not:string,in:string[],not_in:string[],contains:string}

        }
    }
    

export interface ReadModelEntity {
  id: string
  text: string
}

export interface ReadModelUpdateBody {
  text?: string
}


        