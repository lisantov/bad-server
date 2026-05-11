import { AsyncThunk } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from '@store/hooks'
import { RootState } from '@store/store'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

interface PaginationResult<U> {
    data: U[]
    totalPages: number
    currentPage: number
    limit: number
    nextPage: () => void
    prevPage: () => void
    setPage: (page: number) => void
    setLimit: (limit: number) => void
}

const usePagination = <T extends { pagination: { totalPages: number } }, U>(
    asyncAction: AsyncThunk<T, Record<string, unknown>, NonNullable<unknown>>,
    selector: (state: RootState) => U[],
    defaultLimit: number
): PaginationResult<U> => {
    const dispatch = useDispatch()
    const data = useSelector(selector)
    const [searchParams, setSearchParams] = useSearchParams()
    const [totalPages, setTotalPages] = useState<number>(1)

    const currentPage = Math.min(
        Number(searchParams.get('page')) || 1,
        totalPages
    )
    const limit = Number(searchParams.get('limit')) || defaultLimit

    const updateURL = useCallback(
        (newParams: Record<string, string | number | undefined>) => {
            const updatedParams = new URLSearchParams(searchParams)
            Object.entries(newParams).forEach(([key, value]) => {
                if (value !== undefined) {
                    updatedParams.set(key, String(value))
                } else {
                    updatedParams.delete(key)
                }
            })
            setSearchParams(updatedParams)
        },
        [searchParams, setSearchParams]
    )

    const fetchData = useCallback(
        async (params: Record<string, unknown>) => {
            const response = (await dispatch(asyncAction(params))) as { payload: T };
            // response.payload теперь имеет тип T (с полем pagination)
            setTotalPages(response.payload.pagination.totalPages)
        },
        [dispatch, asyncAction]
    )

    const nextPage = useCallback(() => {
        if (currentPage < totalPages) {
            updateURL({ page: currentPage + 1, limit })
        }
    }, [currentPage, totalPages, limit, updateURL])

    const prevPage = useCallback(() => {
        if (currentPage > 1) {
            updateURL({ page: currentPage - 1, limit })
        }
    }, [currentPage, limit, updateURL])

    const setPage = useCallback(
        (page: number) => {
            const newPage = Math.max(1, Math.min(page, totalPages))
            updateURL({ page: newPage, limit })
        },
        [totalPages, limit, updateURL]
    )

    const setLimit = useCallback(
        (newLimit: number) => {
            updateURL({ page: 1, limit: newLimit })
        },
        [updateURL]
    )

    useEffect(() => {
        const params = Object.fromEntries(searchParams.entries()) // все значения — строки, это нормально
        fetchData({ ...params, page: currentPage, limit }).then(() => {
            if (data.length === 0 && currentPage > 1) {
                setPage(1)
            }
        })
    }, [currentPage, data.length, limit, searchParams, fetchData, setPage])

    return {
        data,
        totalPages,
        currentPage,
        limit,
        nextPage,
        prevPage,
        setPage,
        setLimit,
    }
}

export default usePagination