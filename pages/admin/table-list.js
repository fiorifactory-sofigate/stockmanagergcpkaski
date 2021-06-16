//import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// layout for this page
import Admin from "layouts/Admin.js";
// core components
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
// import Table from "components/Table/Table.js";
// import Card from "components/Card/Card.js";
// import CardHeader from "components/Card/CardHeader.js";
// import CardBody from "components/Card/CardBody.js";
import React, { useEffect , useState} from "react";
import ProgressBar from "@badrap/bar-of-progress";

import { Card, CardBody, CardTitle, Col, Row } from "reactstrap";
import axios from "axios";
import { Grid, Table, TableHeaderRow, TableEditColumn, TableInlineCellEditing } from '@devexpress/dx-react-grid-bootstrap4';
import { EditingState } from "@devexpress/dx-react-grid";


const styles = {
  cardCategoryWhite: {
    "&,& a,& a:hover,& a:focus": {
      color: "rgba(255,255,255,.62)",
      margin: "0",
      fontSize: "14px",
      marginTop: "0",
      marginBottom: "0",
    },
    "& a,& a:hover,& a:focus": {
      color: "#FFFFFF",
    },
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
    "& small": {
      color: "#777",
      fontSize: "65%",
      fontWeight: "400",
      lineHeight: "1",
    },
  },
};

function TableList() {
  const useStyles = makeStyles(styles);
  const classes = useStyles();

  const progress = new ProgressBar({
    size: 2,
    color: "#38a169",
    className: "bar-of-progress",
    delay: 100,
  });

  const [columns] = useState([
    {
        title: "Id",
        name: "entryid",
        sortable: true
    },
    {
      title: "Product",
      name: "product",
      sortable: true
    },
    {
        title: "Description",
        name: "description",
        sortable: true,
    },
    {
        title: "Stock",
        name: "stock",
        sortable: true,
    }
]);





const [rows, setRows] = useState([]);
const [editingCells, setEditingCells] = useState([]);

// iitial load of data with loading bar

useEffect(() => {
 progress.start();
            axios.get('/api/products')
            .then(resp => {
              
                setRows(resp.data);
                progress.finish();
            })
            .catch(err => {
                // Handle Error Here
                console.error(err);
            });
}, []);


// editable table handler fns



const commitChanges = ({ added, changed, deleted }) => {
      
  let changedRows;
  progress.start();
  if (added) {
    debugger;
      const startingAddedId = rows.length > 0
          ? Math.max(rows[rows.length - 1].entryid, rows[0].entryid) + 1
          : 0;
      changedRows = [
          ...added.map((row, index) => ({
              entryid: startingAddedId + index,
              ...row,
          })),
          ...rows,
      ];
      debugger;
      setEditingCells([{ rowId: 0, columnName: columns[0].name }]);
      axios.post('/api/products',{product:"",description:"",stock:"0"});
  }
  if (changed) {
    
    
    
    for (let index = 0; index < rows.length; index++) {
      const element = rows[index];
      
         let fg = changed[element.entryid] ? { ...element, ...changed[element.entryid]  } : false;
        if(fg){
          let dt = fg;
          const path = dt.link;
          delete dt.link;
          
          const res =  axios.put(path, dt);
        }
    }

      changedRows = rows.map(row => (
        
        changed[row.entryid] ? { ...row, ...changed[row.entryid] 
        
        } : row));
      
  }
  if (deleted) {
    debugger;
    
      const deletedSet = new Set(deleted);
      changedRows = rows.filter(row => !deletedSet.has(row.entryid));
    const delRows = rows.filter(row => deletedSet.has(row.entryid));
      for (let index = 0; index < delRows.length; index++) {
        const elementD = delRows[index];
        const res =  axios.delete(elementD.link);
          
      }
     
  }
  
  //setRows(changedRows);
 
  const timer = setTimeout(() => {
    progress.start();
          axios.get('/api/products')
          .then(resp => {
            
              setRows(resp.data);
              progress.finish();
          })
          .catch(err => {
              // Handle Error Here
              console.error(err);
              progress.finish();
          });
  }, 2000);
  return () => clearTimeout(timer);

 
  
  
};

const addEmptyRow = () => commitChanges({ added: [{}] });
const getRowId = row => row.entryid;

const FocusableCell = ({ onClick, ...restProps }) => (
<Table.Cell {...restProps} tabIndex={0} onFocus={onClick} />
);



  return (<div>
   <h1>Stock Manager</h1>
   <Card>
        <CardBody className="iq-card-body">
                        <Grid
                            rows={rows}
                            columns={columns}
                            getRowId={getRowId}
                        >
                            <EditingState
                                onCommitChanges={commitChanges}
                                editingCells={editingCells}
                                onEditingCellsChange={setEditingCells}
                                addedRows={[]}
                                onAddedRowsChange={addEmptyRow}
                            />
                            <Table  />
                            <TableHeaderRow />
                            <TableInlineCellEditing selectTextOnEditStart />
                            <TableEditColumn
                                showAddCommand
                                showDeleteCommand
                            />
                        </Grid>

                       
                    </CardBody>
        </Card>
  </div>


  );
}

TableList.layout = Admin;

export default TableList;
