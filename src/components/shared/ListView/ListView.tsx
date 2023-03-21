import {Box, ButtonGroup, Center, IconButton, Text} from "@chakra-ui/react"
import {invert, union, without} from "lodash"
import {useRouter} from "next/router"
import {ListPage, ListPageWithFacets, Meta, Product} from "ordercloud-javascript-sdk"
import {ReactElement, useCallback, useEffect, useMemo, useState} from "react"
import {HiOutlineViewGrid, HiOutlineViewList} from "react-icons/hi"
import DataGrid, {IDataGrid} from "../DataGrid/DataGrid"
import DataTable, {IDataTable} from "../DataTable/DataTable"
import Pagination from "../Pagination/Pagination"

export interface IDefaultResource {
  ID?: string
  Name?: string
}

export interface ListViewTableOptions<T>
  extends Omit<IDataTable<T>, "data" | "selected" | "handleSelectionChange" | "rowActions" | "onSortChange"> {}

export interface ListViewGridOptions<T>
  extends Omit<IDataGrid<T>, "data" | "selected" | "handleSelectionChange" | "gridItemActions"> {}

export type ListViewTemplate = ReactElement | ReactElement[] | string

interface IListView<T, F = any> {
  initialViewMode?: "grid" | "table"
  service?: (...args) => Promise<T extends Product ? ListPageWithFacets<T, F> : ListPage<T>>
  itemActions?: (item: T) => ListViewTemplate
  tableOptions: ListViewTableOptions<T>
  gridOptions?: ListViewGridOptions<T>
  paramMap?: {[key: string]: string}
  queryMap?: {[key: string]: string}
  filterMap?: {[key: string]: string}
  children?: (props: ListViewChildrenProps) => ReactElement
  noResultsMessage?: ListViewTemplate
  noDataMessage?: ListViewTemplate
}

export interface ListViewChildrenProps {
  meta?: Meta
  items?: any[] //TODO can we make this strongly typed?
  viewModeToggle: React.ReactElement
  updateQuery: (queryKey: string, resetPage?: boolean) => (value: string | boolean | number) => void
  upsertItems: (items: any[]) => void
  removeItems: (itemIds: string[]) => void
  routeParams: any
  queryParams: any
  filterParams: any
  selected: string[]
  loading: boolean
  renderContent: ListViewTemplate
}

const DEFAULT_NO_RESULTS_MESSAGE: ReactElement = (
  <Center h={100}>
    <Text>No results. Try clearing your search and/or filters.</Text>
  </Center>
)

const DEFAULT_NO_DATA_MESSAGE: ReactElement = (
  <Center h={100}>
    <Text>Nothing here yet. Try creating a new item first.</Text>
  </Center>
)

const ListView = <T extends IDefaultResource>({
  service,
  paramMap,
  queryMap,
  filterMap,
  itemActions,
  tableOptions,
  gridOptions,
  initialViewMode = "table",
  children,
  noResultsMessage = DEFAULT_NO_RESULTS_MESSAGE,
  noDataMessage = DEFAULT_NO_DATA_MESSAGE
}: IListView<T>) => {
  const [data, setData] = useState<(T extends Product ? ListPageWithFacets<T> : ListPage<T>) | undefined>()
  const [viewMode, setViewMode] = useState<"grid" | "table">(initialViewMode)
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const invertedQueryMap = invert(queryMap)

  const handleSelectChange = useCallback((changed: string | string[], isSelected: boolean) => {
    let changedIds = typeof changed === "string" ? [changed] : changed
    setSelected((s) => (isSelected ? union(s, changedIds) : without(s, ...changedIds)))
  }, [])

  const {push, pathname, isReady, query} = useRouter()

  const mapRouterQuery = useCallback(
    (map?: {[key: string]: string}) => {
      let result = {}
      if (!isReady) return result
      if (!map) return result
      Object.entries(query).forEach(([key, val]: [string, string]) => {
        if (map[key]) {
          result[map[key]] = val
        }
      })
      return result
    },
    [query, isReady]
  )

  const params = useMemo(() => {
    return {
      routeParams: mapRouterQuery(paramMap),
      queryParams: mapRouterQuery(queryMap),
      filterParams: mapRouterQuery(filterMap)
    }
  }, [paramMap, queryMap, filterMap, mapRouterQuery])

  const fetchData = useCallback(async () => {
    let response
    setLoading(true)
    const listOptions = {
      ...params.queryParams,
      filters: params.filterParams
    }
    if (Object.values(params.routeParams).length) {
      response = await service(...Object.values(params.routeParams), listOptions)
    } else {
      response = await service(listOptions)
    }
    setData(response)
    setLoading(false)
  }, [service, params])

  useEffect(() => {
    if (isReady) {
      fetchData()
    }
  }, [fetchData, isReady])

  const handleUpsertItems = useCallback((items: T[]) => {
    setData(
      (d) =>
        ({
          Meta: d.Meta,
          Items: d.Items.map((item) => {
            const newItem = items.find((i) => i.ID === item.ID)
            if (newItem) {
              return newItem
            }
            return item
          })
        } as typeof d)
    )
  }, [])

  const handleRemoveItems = useCallback((itemIds: string[]) => {
    setData((d) => ({Meta: d.Meta, Items: d.Items.filter((i) => !itemIds.includes(i.ID))} as typeof d))
  }, [])

  const viewModeToggle = useMemo(() => {
    return (
      <ButtonGroup isAttached variant="secondaryButton">
        <IconButton
          aria-label="Grid View"
          isActive={viewMode === "grid"}
          icon={<HiOutlineViewGrid />}
          onClick={() => setViewMode("grid")}
        />
        <IconButton
          aria-label="List View"
          isActive={viewMode === "table"}
          icon={<HiOutlineViewList />}
          onClick={() => setViewMode("table")}
        />
      </ButtonGroup>
    )
  }, [viewMode])

  const handleUpdateQuery = useCallback(
    (queryKey: string, resetPage?: boolean) => (value: string | boolean | number) => {
      push({
        pathname: pathname,
        query: {
          ...query,
          [invertedQueryMap["Page"]]: resetPage ? 1 : query[invertedQueryMap["Page"]],
          [queryKey]: value
        }
      })
    },
    [push, pathname, query, invertedQueryMap]
  )

  const currentSort = useMemo(() => {
    return params.queryParams["SortBy"]
  }, [params.queryParams])

  const handleSortChange = useCallback(
    (sortKey: string, isSorted: boolean, isSortedDesc: boolean) => {
      let sorts = currentSort ? currentSort.split(",") : []
      if (isSorted) {
        if (isSortedDesc) {
          sorts = sorts.filter((s) => s !== `!${sortKey}`)
        } else {
          sorts = sorts.map((s) => {
            if (s === sortKey) {
              return `!${sortKey}`
            }
            return s
          })
        }
      } else {
        sorts.push(sortKey)
      }
      handleUpdateQuery(invertedQueryMap["SortBy"])(sorts.join(","))
    },
    [handleUpdateQuery, currentSort, invertedQueryMap]
  )

  const currentPage = useMemo(() => {
    return params.queryParams["Page"] ? Number(params.queryParams["Page"]) : 1
  }, [params.queryParams])

  //reset selected on query change
  useEffect(() => {
    setSelected([])
  }, [params.queryParams, params.filterParams, params.routeParams])

  const isSearching = useMemo(() => {
    return Boolean(params.queryParams["Search"] || Object.values(params.filterParams).filter((v) => Boolean(v)).length)
  }, [params.queryParams, params.filterParams])

  const renderContent = useMemo(() => {
    if (loading || (!loading && data)) {
      return (
        <Box mb={5}>
          {viewMode === "grid" ? (
            //GRID VIEW
            <DataGrid
              {...gridOptions}
              loading={loading}
              emptyDisplay={isSearching ? noResultsMessage : noDataMessage}
              gridItemActions={itemActions}
              data={data && data.Items}
              selected={selected}
              onSelectChange={handleSelectChange}
            />
          ) : (
            //TABLE VIEW
            <DataTable
              {...tableOptions}
              loading={loading}
              rowActions={itemActions}
              data={data && data.Items}
              selected={selected}
              emptyDisplay={isSearching ? noResultsMessage : noDataMessage}
              onSelectChange={handleSelectChange}
              onSortChange={handleSortChange}
              currentSort={currentSort}
            />
          )}
          {data && data.Meta && data.Meta.TotalPages > 1 && (
            <Center>
              <Pagination page={currentPage} totalPages={data.Meta.TotalPages} onChange={handleUpdateQuery("p")} />
            </Center>
          )}
        </Box>
      )
    }
  }, [
    data,
    viewMode,
    loading,
    itemActions,
    tableOptions,
    gridOptions,
    isSearching,
    noResultsMessage,
    noDataMessage,
    currentSort,
    selected,
    currentPage,
    handleUpdateQuery,
    handleSelectChange,
    handleSortChange
  ])

  const childrenProps = useMemo(() => {
    return {
      viewModeToggle,
      items: data ? data.Items : undefined,
      meta: data ? data.Meta : undefined,
      upsertItems: handleUpsertItems,
      removeItems: handleRemoveItems,
      updateQuery: handleUpdateQuery,
      routeParams: params.routeParams,
      queryParams: params.queryParams,
      filterParams: params.filterParams,
      selected,
      loading,
      renderContent
    }
  }, [
    data,
    selected,
    loading,
    viewModeToggle,
    params,
    handleUpdateQuery,
    handleUpsertItems,
    handleRemoveItems,
    renderContent
  ])

  return children(childrenProps)
}

export default ListView
