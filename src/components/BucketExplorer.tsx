import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import axios from 'axios';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs() {
  const [value, setValue] = React.useState(0);
  const [buckets, setBuckets] = React.useState([]);
  const [bucketContents, setBucketContents] = React.useState(null);

  async function getBuckets() {
    const buckets = await axios.get('/database/getBuckets');
    setBuckets(buckets.data);
  }

  async function getContent() {
    const bucketContent = await axios.post('/database/getContents', {
      bucketName: buckets,
    });
    setBucketContents(bucketContent.data);
  }
  React.useEffect(() => {
    getBuckets();
  }, []);

  React.useEffect(() => {
    if (buckets.length > 0) {
      getContent();
    }
  }, [buckets]);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Storage Buckets"
        >
          {buckets.map((el, key) => {
            return <Tab key={el.id} label={el.name} {...a11yProps(key)} />;
          })}
        </Tabs>
      </Box>
      {buckets.map((el, key) => {
        return (
          <TabPanel key={el.id} value={value} index={key}>
            {bucketContents &&
              bucketContents[el.name].map((folders, key) => {
                return (
                  <Accordion key={key}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`panel1a-content-${key}`}
                      id={`panel1a-content-${key}`}
                    >
                      <Typography>{folders.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {bucketContents[el.name][key]['content'].map(
                        (files, fileKey) => {
                          return (
                            <Typography key={fileKey}>{files.name}</Typography>
                          );
                        },
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
          </TabPanel>
        );
      })}
    </Box>
  );
}
