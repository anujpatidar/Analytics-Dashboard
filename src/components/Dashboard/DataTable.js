import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronDown, FiChevronUp, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';

const TableContainer = styled.div`
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const TableHeader = styled.div`
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
`;

const TableTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 0;
`;

const TableControls = styled.div`
  display: flex;
  align-items: center;
`;

const SearchInput = styled.div`
  position: relative;
  margin-right: var(--spacing-md);
  
  input {
    width: 220px;
    height: 36px;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-color);
    padding: 0 var(--spacing-md) 0 var(--spacing-xl);
    font-size: 0.9rem;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(0, 115, 182, 0.2);
    }
  }
  
  svg {
    position: absolute;
    left: var(--spacing-sm);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    font-size: 1rem;
  }
`;

const ControlButton = styled.button`
  height: 36px;
  padding: 0 var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  margin-left: var(--spacing-sm);
  transition: all 0.3s ease;
  
  svg {
    margin-right: var(--spacing-xs);
  }
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--primary-color);
    border-color: var(--primary-color);
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const TableHead = styled.thead`
  background-color: var(--background-accent);
  
  th {
    padding: var(--spacing-md);
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    position: relative;
  }
`;

const SortButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-weight: inherit;
  padding: 0;
  margin-left: var(--spacing-xs);
  
  svg {
    font-size: 1rem;
    color: ${props => props.active ? 'var(--primary-color)' : 'var(--text-secondary)'};
  }
`;

const TableBody = styled.tbody`
  tr {
    &:nth-child(even) {
      background-color: var(--background-accent);
    }
    
    &:hover {
      background-color: rgba(0, 115, 182, 0.05);
    }
  }
  
  td {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    
    &:last-child {
      text-align: right;
    }
  }
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
`;

const TableInfo = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
`;

const PageButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  border-radius: var(--border-radius-sm);
  margin: 0 2px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.active ? 'white' : 'var(--primary-color)'};
    border-color: ${props => props.active ? 'var(--primary-color)' : 'var(--border-color)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background-color: transparent;
      color: var(--text-secondary);
      border-color: var(--border-color);
    }
  }
`;

const DataTable = ({ 
  title, 
  columns, 
  data, 
  pagination = true, 
  itemsPerPage = 10 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Sorting logic
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);
  
  // Filtering/Search logic
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return sortedData;
    
    return sortedData.filter(item => 
      Object.values(item).some(
        value => 
          value && 
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [sortedData, searchQuery]);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = pagination 
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) 
    : filteredData;
  
  return (
    <TableContainer>
      <TableHeader>
        <TableTitle>{title}</TableTitle>
        <TableControls>
          <SearchInput>
            <FiSearch />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInput>
          <ControlButton>
            <FiFilter />
            Filter
          </ControlButton>
          <ControlButton>
            <FiDownload />
            Export
          </ControlButton>
        </TableControls>
      </TableHeader>
      
      <div style={{ overflow: 'auto', flex: 1 }}>
        <StyledTable>
          <TableHead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.title}
                  {column.sortable && (
                    <SortButton 
                      active={sortConfig.key === column.key}
                      onClick={() => handleSort(column.key)}
                    >
                      {sortConfig.key === column.key && sortConfig.direction === 'asc' 
                        ? <FiChevronUp /> 
                        : <FiChevronDown />
                      }
                    </SortButton>
                  )}
                </th>
              ))}
            </tr>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </TableBody>
        </StyledTable>
      </div>
      
      {pagination && totalPages > 0 && (
        <TableFooter>
          <TableInfo>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </TableInfo>
          <Pagination>
            <PageButton 
              onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </PageButton>
            
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }
              
              return (
                <PageButton 
                  key={pageNumber}
                  active={currentPage === pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </PageButton>
              );
            })}
            
            <PageButton 
              onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </PageButton>
          </Pagination>
        </TableFooter>
      )}
    </TableContainer>
  );
};

export default DataTable; 