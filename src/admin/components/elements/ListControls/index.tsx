import React, { useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import SearchFilter from '../SearchFilter';
import ColumnSelector from '../ColumnSelector';
import WhereBuilder from '../WhereBuilder';
import SortComplex from '../SortComplex';
import Button from '../Button';
import { Props } from './types';

import './index.scss';

const baseClass = 'list-controls';

const ListControls: React.FC<Props> = (props) => {
  const {
    handleChange,
    collection,
    enableColumns = true,
    enableSort = false,
    setSort,
    collection: {
      fields,
      admin: {
        useAsTitle,
      },
    },
  } = props;

  const [titleField, setTitleField] = useState(null);
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState([]);
  const [where, setWhere] = useState({});
  const [visibleDrawer, setVisibleDrawer] = useState<'where' | 'sort' | 'columns'>();

  useEffect(() => {
    if (useAsTitle) {
      const foundTitleField = fields.find((field) => field.name === useAsTitle);

      if (foundTitleField) {
        setTitleField(foundTitleField);
      }
    }
  }, [useAsTitle, fields]);

  useEffect(() => {
    const newState: any = {
      columns,
    };

    if (search) {
      newState.where = {
        and: [
          search,
        ],
      };
    }

    if (where) {
      if (!search) {
        newState.where = {
          and: [],
        };
      }

      newState.where.and.push(where);
    }

    handleChange(newState);
  }, [search, columns, where, handleChange]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <SearchFilter
          handleChange={setSearch}
          fieldName={titleField ? titleField.name : undefined}
          fieldLabel={titleField ? titleField.label : undefined}
        />
        <div className={`${baseClass}__buttons`}>
          <div className={`${baseClass}__buttons-wrap`}>
            {enableColumns && (
              <Button
                className={`${baseClass}__toggle-columns`}
                buttonStyle={visibleDrawer === 'columns' ? undefined : 'secondary'}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined)}
                icon="chevron"
                iconStyle="none"
              >
                Columns
              </Button>
            )}
            <Button
              className={`${baseClass}__toggle-where`}
              buttonStyle={visibleDrawer === 'where' ? undefined : 'secondary'}
              onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined)}
              icon="chevron"
              iconStyle="none"
            >
              Filters
            </Button>
            {enableSort && (
              <Button
                className={`${baseClass}__toggle-sort`}
                buttonStyle={visibleDrawer === 'sort' ? undefined : 'secondary'}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined)}
                icon="chevron"
                iconStyle="none"
              >
                Sort
              </Button>
            )}
          </div>
        </div>
      </div>
      {enableColumns && (
        <AnimateHeight
          className={`${baseClass}__columns`}
          height={visibleDrawer === 'columns' ? 'auto' : 0}
        >
          <ColumnSelector
            collection={collection}
            handleChange={setColumns}
          />
        </AnimateHeight>
      )}
      <AnimateHeight
        className={`${baseClass}__where`}
        height={visibleDrawer === 'where' ? 'auto' : 0}
      >
        <WhereBuilder
          handleChange={setWhere}
          collection={collection}
        />
      </AnimateHeight>
      {enableSort && (
        <AnimateHeight
          className={`${baseClass}__sort`}
          height={visibleDrawer === 'sort' ? 'auto' : 0}
        >
          <SortComplex
            handleChange={setSort}
            collection={collection}
          />
        </AnimateHeight>
      )}
    </div>
  );
};

export default ListControls;
