import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ComplaintStatus, UserRole } from '../constants/enums';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { useComplaintStore } from '../stores/complaintStore';
import { datetime } from '../utils/format';

export function ComplaintManage() {
  const role = useAuthStore((state) => state.user?.role);
  const { complaints, current, loadComplaints, loadComplaint, handleComplaint } = useComplaintStore();
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [handleOpen, setHandleOpen] = useState(false);
  const [handleStatus, setHandleStatus] = useState<ComplaintStatus>(ComplaintStatus.PROCESSING);
  const [handleResult, setHandleResult] = useState('');

  useEffect(() => { loadComplaints(status ? { status } : undefined); }, [loadComplaints, status]);

  const openHandle = (id: string) => {
    loadComplaint(id);
    setHandleOpen(true);
    setHandleStatus(ComplaintStatus.PROCESSING);
    setHandleResult('');
  };

  const submitHandle = async () => {
    if (!current || !handleResult.trim()) return;
    await handleComplaint(current.id, { status: handleStatus, handleResult: handleResult.trim() });
    setHandleOpen(false);
  };

  return (
    <>
      <PageHeader
        title="投诉管理"
        subtitle={role === UserRole.ADMIN ? '处理客户投诉并反馈结果' : '我的投诉记录与处理进度'}
        actions={<TextField select size="small" label="状态" value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus | '')} sx={{ minWidth: 160 }}>
          <MenuItem value="">全部</MenuItem>
          {Object.values(ComplaintStatus).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>}
      />
      {!complaints.length && <EmptyState title="暂无投诉" />}
      <Grid container spacing={2}>
        {complaints.map((item) => (
          <Grid item xs={12} lg={6} key={item.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{item.title}</Typography>
                  <StatusBadge value={`complaint:${item.status}`} />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 1 }}>关联订单：
                  <Link to={`/orders/${item.orderId}`} style={{ marginLeft: 4 }}>
                    {item.order?.orderNo || item.orderId}
                  </Link>
                </Typography>
                <Typography color="text.secondary">投诉人：{item.customer?.nickname || item.customerId} · 提交时间：{datetime(item.createdAt)}</Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">投诉内容</Typography>
                  <Typography sx={{ mt: 0.5 }}>{item.content}</Typography>
                </Box>
                {item.handleResult && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">处理结果{item.handler && ` · ${item.handler.nickname}`}</Typography>
                    <Typography sx={{ mt: 0.5 }}>{item.handleResult}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>处理时间：{datetime(item.updatedAt)}</Typography>
                  </Box>
                )}
                {role === UserRole.ADMIN && item.status !== ComplaintStatus.RESOLVED && item.status !== ComplaintStatus.REJECTED && (
                  <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={() => openHandle(item.id)}>处理投诉</Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={handleOpen} onClose={() => setHandleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>处理投诉</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="处理结果" fullWidth value={handleStatus} onChange={(e) => setHandleStatus(e.target.value as ComplaintStatus)}>
              <MenuItem value={ComplaintStatus.PROCESSING}>处理中</MenuItem>
              <MenuItem value={ComplaintStatus.RESOLVED}>已解决</MenuItem>
              <MenuItem value={ComplaintStatus.REJECTED}>驳回</MenuItem>
            </TextField>
            <TextField label="处理说明" fullWidth multiline minRows={5} value={handleResult} onChange={(e) => setHandleResult(e.target.value)} placeholder="请填写处理说明" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHandleOpen(false)}>取消</Button>
          <Button variant="contained" onClick={submitHandle} disabled={!handleResult.trim()}>提交处理</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
