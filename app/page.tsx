"use client"

import { useState, useEffect } from "react"
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Users, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DataRecord {
  [key: string]: any
}

export default function BorderSecurityDashboard() {
  const [data, setData] = useState<DataRecord[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Replace this with your actual AWS API endpoint
  const AWS_API_URL = "https://944wkn0pz2.execute-api.eu-north-1.amazonaws.com/default/GetData"

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(AWS_API_URL)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const jsonData = await response.json()

      // Handle different JSON structures
      const records = Array.isArray(jsonData) ? jsonData : jsonData.data || jsonData.records || jsonData.Items || []

      if (records.length > 0) {
        // Extract column names from the first record
        const columnNames = Object.keys(records[0])
        setColumns(columnNames)
        setData(records)
      } else {
        setColumns([])
        setData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data from AWS API")
      console.error("API fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = data.filter((record) =>
    Object.values(record).some((value) => value?.toString().toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Dynamic statistics based on available data
  const getStats = () => {
    const stats = {
      total: data.length,
      columns: columns.length,
    }

    // Add dynamic stats based on common column patterns
    const statusColumns = columns.filter(
      (col) =>
        col.toLowerCase().includes("status") ||
        col.toLowerCase().includes("state") ||
        col.toLowerCase().includes("alert"),
    )

    const booleanColumns = columns.filter((col) => {
      const sampleValues = data.slice(0, 10).map((record) => record[col])
      return sampleValues.some(
        (val) => val === "true" || val === "false" || val === true || val === false || val === "1" || val === "0",
      )
    })

    return { ...stats, statusColumns: statusColumns.length, booleanColumns: booleanColumns.length }
  }

  const stats = getStats()

  // Format cell value based on content
  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined) return "N/A"

    const colLower = columnName.toLowerCase()
    const valString = value.toString().toLowerCase()

    // Handle boolean-like values
    if (valString === "true" || value === true || value === 1 || value === "1") {
      if (colLower.includes("panic") || colLower.includes("alert") || colLower.includes("emergency")) {
        return <Badge variant="destructive">ALERT</Badge>
      }
      if (colLower.includes("fall")) {
        return <Badge variant="destructive">FALL DETECTED</Badge>
      }
      if (colLower.includes("active") || colLower.includes("online")) {
        return (
          <Badge variant="default" className="bg-green-500">
            ACTIVE
          </Badge>
        )
      }
      return <Badge variant="secondary">TRUE</Badge>
    }

    if (valString === "false" || value === false || value === 0 || value === "0") {
      return <Badge variant="secondary">Normal</Badge>
    }

    // Handle timestamps
    if (colLower.includes("time") || colLower.includes("date")) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleString()
        }
      } catch (e) {
        // Not a valid date, return as is
      }
    }

    // Handle coordinates
    if (colLower.includes("lat") || colLower.includes("lng") || colLower.includes("long")) {
      const num = Number.parseFloat(value)
      if (!isNaN(num)) {
        return num.toFixed(6)
      }
    }

    // Handle status-like columns
    if (colLower.includes("status") || colLower.includes("state")) {
      if (valString.includes("alert") || valString.includes("danger") || valString.includes("critical")) {
        return <Badge variant="destructive">{value}</Badge>
      }
      if (valString.includes("normal") || valString.includes("ok") || valString.includes("safe")) {
        return (
          <Badge variant="default" className="bg-green-500">
            {value}
          </Badge>
        )
      }
      return <Badge variant="secondary">{value}</Badge>
    }

    return value.toString()
  }

  // Format column name for display
  const formatColumnName = (columnName: string) => {
    return columnName
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

 if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-full mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Data</h3>
              <p className="text-gray-600">Fetching data from AWS API...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FireForce</h1>
              <p className="text-gray-600">Intelligent Fire Safety System</p>
            </div>
          </div>
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button onClick={fetchData} variant="outline" size="sm" className="ml-2 bg-transparent">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Columns</p>
                    <p className="text-2xl font-bold">{stats.columns}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status Columns</p>
                    <p className="text-2xl font-bold">{stats.statusColumns}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Boolean Columns</p>
                    <p className="text-2xl font-bold">{stats.booleanColumns}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Records</CardTitle>
                  <CardDescription>
                    Showing {filteredData.length} of {data.length} records with {columns.length} columns
                  </CardDescription>
                </div>
                <Input
                  placeholder="Search all data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {formatColumnName(column)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                          {searchTerm ? "No records match your search" : "No data available"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((record, index) => (
                        <TableRow key={index}>
                          {columns.map((column) => (
                            <TableCell key={column} className="whitespace-nowrap">
                              {formatCellValue(record[column], column)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Column Information */}
        {columns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Structure</CardTitle>
              <CardDescription>Available columns in your dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {columns.map((column, index) => (
                  <Badge key={column} variant="outline" className="justify-start">
                    {index + 1}. {formatColumnName(column)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && data.length === 0 && !error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600 mb-4">No records found from the API endpoint.</p>
                <Button onClick={fetchData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
