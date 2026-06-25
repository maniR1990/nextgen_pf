/**
 * Generic CRUD base (spec compatibility).
 * Feature repos live in src/modules; extend or compose as needed.
 */
export interface BaseRepository<T, CreateDto, UpdateDto> {
  findById(id: string): Promise<T>;
  findAll(skip?: number, take?: number): Promise<T[]>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  deleteById(id: string): Promise<void>;
}
