import React from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';
import capitalize from 'lodash/capitalize';
import {getErrorMessages} from 'coral-framework/utils';
import styles from './UserDetail.css';
import RejectButton from './RejectButton';
import ApproveButton from './ApproveButton';
import AccountHistory from './AccountHistory';
import {Slot} from 'coral-framework/components';
import UserDetailCommentList from '../components/UserDetailCommentList';
import {getReliability} from 'coral-framework/utils/user';
import ButtonCopyToClipboard from './ButtonCopyToClipboard';
import ClickOutside from 'coral-framework/components/ClickOutside';
import {Icon, Drawer, Spinner, TabBar, Tab, TabContent, TabPane} from 'coral-ui';
import ActionsMenu from 'coral-admin/src/components/ActionsMenu';
import ActionsMenuItem from 'coral-admin/src/components/ActionsMenuItem';

class UserDetail extends React.Component {

  rejectThenReload = async (info) => {
    try {
      await this.props.rejectComment(info);
      this.props.data.refetch();
    } catch (err) {

      console.error(err);
      this.props.notify('error', getErrorMessages(err));
    }
  }

  acceptThenReload = async (info) => {
    try {
      await this.props.acceptComment(info);
      this.props.data.refetch();
    } catch (err) {

      console.error(err);
      this.props.notify('error', getErrorMessages(err));
    }
  }

  bulkAcceptThenReload = async () => {
    try {
      await this.props.bulkAccept();
      this.props.data.refetch();
    } catch (err) {

      console.error(err);
      this.props.notify('error', getErrorMessages(err));
    }
  }

  bulkRejectThenReload = async () => {
    try {
      await this.props.bulkReject();
      this.props.data.refetch();
    } catch (err) {

      console.error(err);
      this.props.notify('error', getErrorMessages(err));
    }
  }

  changeTab = (tab) => {
    this.props.changeStatus(tab);
  }

  showSuspendUserDialog = () => {
    const {comment, showSuspendUserDialog} = this.props;
    return showSuspendUserDialog({
      userId: comment.user.id,
      username: comment.user.username,
    });
  };

  showBanUserDialog = () => {
    const {root: {user}, showBanUserDialog} = this.props;
    const {comment, showBanUserDialog} = this.props;
    return showBanUserDialog({
      userId: user.id,
      username: user.username,
    });
  };

  render() {

    if (this.props.loading) {
      return (
        <ClickOutside onClickOutside={this.props.hideUserDetail}>
          <Drawer onClose={this.props.hideUserDetail}>
            <Spinner />
          </Drawer>
        </ClickOutside>
      );
    }

    const {
      data,
      root,
      root: {
        user,
        totalComments,
        rejectedComments,
        comments: {
          nodes,
        }
      },
      activeTab,
      selectedCommentIds,
      toggleSelect,
      hideUserDetail,
      viewUserDetail,
      loadMore,
      toggleSelectAll
    } = this.props;

    let rejectedPercent = (rejectedComments / totalComments) * 100;

    if (rejectedPercent === Infinity || isNaN(rejectedPercent)) {
      rejectedPercent = 0;
    }

    return (
      <ClickOutside onClickOutside={hideUserDetail}>
        <Drawer onClose={hideUserDetail}>
          <h3>{user.username}</h3>

          {console.log(user)}

          <ActionsMenu icon="not_interested" className="talk-admin-user-detail-actions-menu">
            <ActionsMenuItem
              disabled={user.state.status.suspension.status}
              onClick={this.showSuspendUserDialog}>
              Suspend User</ActionsMenuItem>
            <ActionsMenuItem
              disabled={user.state.status.banned.status}
              onClick={this.showBanUserDialog}>
              Ban User
            </ActionsMenuItem>
          </ActionsMenu>

          <div>
            <ul className={styles.userDetailList}>
              <li>
                <Icon name="assignment_ind" />
                <span className={styles.userDetailItem}>Member Since:</span>
                {new Date(user.created_at).toLocaleString()}
              </li>

              {user.profiles.map(({id}) =>
                <li key={id}>
                  <Icon name="email" />
                  <span className={styles.userDetailItem}>Email:</span>
                  {id} <ButtonCopyToClipboard className={styles.copyButton} icon="content_copy" copyText={id} />
                </li>
              )}
            </ul>

            <ul className={styles.stats}>
              <li className={styles.stat}>
                <span className={styles.statItem}>Total Comments</span>
                <span className={styles.statResult}>{totalComments}</span>
              </li>
              <li className={styles.stat}>
                <span className={styles.statItem}>Reject Rate</span>
                <span className={styles.statResult}>
                  {rejectedPercent.toFixed(1)}%
                </span>
              </li>
              <li className={styles.stat}>
                <span className={styles.statItem}>Reports</span>
                <span className={cn(styles.statReportResult, styles[getReliability(user.reliable.flagger)])}>
                  {capitalize(getReliability(user.reliable.flagger))}
                </span>
              </li>
            </ul>
          </div>

          <Slot
            fill="userProfile"
            data={this.props.data}
            queryData={{root, user}}
          />

          <hr />
          
          <div className={(selectedCommentIds.length > 0) ? cn(styles.bulkActionHeader, styles.selected) : styles.bulkActionHeader}>

            {
              selectedCommentIds.length === 0
                ? (
                  <TabBar
                    onTabClick={this.changeTab}
                    activeTab={activeTab}
                    className={cn(styles.tabBar, 'talk-admin-user-detail-tab-bar')}
                    aria-controls='talk-admin-user-detail-content'
                    tabClassNames={{
                      button: styles.tabButton,
                      buttonActive: styles.tabButtonActive,
                    }} >
                    <Tab
                      tabId={'all'}
                      className={cn(styles.tab, styles.button, 'talk-admin-user-detail-all-tab')} >
                      All
                    </Tab>
                    <Tab 
                      tabId={'rejected'}
                      className={cn(styles.tab, 'talk-admin-user-detail-rejected-tab')} >
                      Rejected
                    </Tab>
                    <Tab tabId={'history'} className={cn(styles.tab, styles.button, 'talk-admin-user-detail-history-tab')}>
                      Account History
                    </Tab>
                  </TabBar>
                )
                : (
                  <div className={styles.bulkActionGroup}>
                    <ApproveButton
                      onClick={this.bulkAcceptThenReload}
                      minimal
                    />
                    <RejectButton
                      onClick={this.bulkRejectThenReload}
                      minimal
                    />
                    <span className={styles.selectedCommentsInfo}>  {selectedCommentIds.length} comments selected</span>
                  </div>
                )
            }

            {(activeTab === 'all' || activeTab === 'rejected') && (
              <div className={styles.toggleAll}>
                <input
                  type='checkbox'
                  id='toogleAll'
                  checked={selectedCommentIds.length > 0 && selectedCommentIds.length === nodes.length}
                  onChange={(e) => {
                    toggleSelectAll(nodes.map((comment) => comment.id), e.target.checked);
                  }} />
                <label htmlFor='toogleAll'>Select all</label>
              </div>
            )}

          </div>

          <TabContent activeTab={activeTab} className='talk-admin-user-detail-content'>
            <TabPane tabId={'all'} className={'talk-admin-user-detail-all-tab-pane'}>
              <UserDetailCommentList
                user={user}
                root={root}
                data={data}
                loadMore={loadMore}
                toggleSelect={toggleSelect}
                viewUserDetail={viewUserDetail}
                acceptComment={this.acceptThenReload}
                rejectComment={this.rejectThenReload}
                selectedCommentIds={selectedCommentIds}
              />
            </TabPane>
            <TabPane tabId={'rejected'} className={'talk-admin-user-detail-rejected-tab-pane'}>
              <UserDetailCommentList
                user={user}
                root={root}
                data={data}
                loadMore={loadMore}
                toggleSelect={toggleSelect}
                viewUserDetail={viewUserDetail}
                acceptComment={this.acceptThenReload}
                rejectComment={this.rejectThenReload}
                selectedCommentIds={selectedCommentIds}
              />
            </TabPane>
            <TabPane tabId={'history'} className={'talk-admin-user-detail-history-tab-pane'}>
              <AccountHistory
                userState={user.state}
              />
            </TabPane>
          </TabContent>
        </Drawer>
      </ClickOutside>
    );
  }
}

UserDetail.propTypes = {
  userId: PropTypes.string.isRequired,
  hideUserDetail: PropTypes.func.isRequired,
  root: PropTypes.object.isRequired,
  acceptComment: PropTypes.func.isRequired,
  rejectComment: PropTypes.func.isRequired,
  changeStatus: PropTypes.func.isRequired,
  toggleSelect: PropTypes.func.isRequired,
  bulkAccept: PropTypes.func.isRequired,
  bulkReject: PropTypes.func.isRequired,
  toggleSelectAll: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  data: PropTypes.shape({
    refetch: PropTypes.func.isRequired,
  }),
  activeTab: PropTypes.string.isRequired,
  selectedCommentIds: PropTypes.array.isRequired,
  viewUserDetail: PropTypes.any.isRequired,
  loadMore: PropTypes.any.isRequired,
  notify: PropTypes.func.isRequired
};

export default UserDetail;
