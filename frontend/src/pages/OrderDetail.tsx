import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrderStatus, UserRole } from '../constants/enums';
import { OrderStatusFlow } from '../components/common/OrderStatusFlow';
import { PageHeader } from '../components/common/PageHeader';
import { RatingStars } from '../components/common/RatingStars';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { useComplaintStore } from '../stores/complaintStore';
import { useOrderStore } from '../stores/orderStore';
import { datetime, money } from '../utils/format';

export function OrderDetail() {
  const { id = '' } = useParams();
  const role = useAuthStore((state) => state.user?.role);
  const { current, loadOrder, updateStatus, cancel, rate } = useOrderStore();
  const { complaints, loadComplaints, createComplaint } = useComplaintStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('服务准时，沟通顺畅。');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintContent, setComplaintContent] = useState('');

  useEffect(() => { loadOrder(id); }, [id, loadOrder]);
  useEffect(() => { if (role === UserRole.CUSTOMER) loadComplaints(); }, [role, loadComplaints]);

  const relatedComplaint = useMemo(() => complaints.find((c) => c.orderId === id), [complaints, id]);

  const submitComplaint = async () => {
    if (!complaintTitle.trim() || !complaintContent.trim()) return;
    await createComplaint({ orderId: id, title: complaintTitle.trim(), content: complaintContent.trim() });
    setComplaintOpen(false);
    setComplaintTitle('');
    setComplaintContent('');
  };

  const actions = useMemo(() => {
    if (!current) return [];
    if (role === UserRole.WORKER) {
      const map: Partial<Record<OrderStatus, [string, OrderStatus]>> = {
        [OrderStatus.ASSIGNED]: ['接单', OrderStatus.ACCEPTED],
        [OrderStatus.ACCEPTED]: ['出发', OrderStatus.ON_THE_WAY],
        [OrderStatus.ON_THE_WAY]: ['开始服务', OrderStatus.IN_PROGRESS],
        [OrderStatus.IN_PROGRESS]: ['完工', OrderStatus.COMPLETED]
      };
      return map[current.status] ? [map[current.status]!] : [];
    }
    if (role === UserRole.ADMIN && current.status === OrderStatus.PENDING) return [['派单给默认技师', OrderStatus.ASSIGNED] as [string, OrderStatus]];
    return [];
  }, [current, role]);

  if (!current) return null;

  return (
    <>
      <PageHeader title="订单详情" subtitle={current.orderNo} actions={<StatusBadge value={current.status} />} />
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card><CardContent>
            <Typography variant="h5">{current.serviceItem.name}</Typography>
            <Typography color="text.secondary">{current.serviceItem.description}</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}><Typography>价格：{money(current.totalPrice)}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography>预约：{datetime(current.scheduledTime)}</Typography></Grid>
              <Grid item xs={12}><Typography>地址：{current.address}{current.addressDetail}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography>联系电话：{current.contactPhone}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography>技师：{current.worker?.name || '待派单'}</Typography></Grid>
            </Grid>
            <Box sx={{ my: 4, overflowX: 'auto' }}><OrderStatusFlow status={current.status} /></Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {actions.map(([label, next]) => <Button key={next} variant="contained" onClick={() => updateStatus(current.id, next)}>{label}</Button>)}
              {role !== UserRole.WORKER && ![OrderStatus.CANCELLED, OrderStatus.RATED].includes(current.status) && <Button color="error" variant="outlined" onClick={() => cancel(current.id, '用户取消')}>取消订单</Button>}
            </Stack>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}><CardContent>
            <Typography variant="h6">地图定位</Typography>
            <Box sx={{ height: 220, mt: 2, borderRadius: 2, bgcolor: '#dfe7de', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>{current.address}</Box>
          </CardContent></Card>
          <Card><CardContent>
            <Typography variant="h6">评价</Typography>
            {current.status === OrderStatus.COMPLETED && role === UserRole.CUSTOMER ? (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <RatingStars value={rating} onChange={setRating} />
                <TextField multiline minRows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button variant="contained" onClick={() => rate(current.id, rating, comment)}>提交评价</Button>
              </Stack>
            ) : current.rating ? (
              <Stack spacing={1} sx={{ mt: 2 }}><RatingStars value={current.rating} readOnly /><Typography>{current.comment}</Typography></Stack>
            ) : <Typography color="text.secondary" sx={{ mt: 2 }}>完工后客户可评价。</Typography>}
          </CardContent></Card>
          {[OrderStatus.COMPLETED, OrderStatus.RATED].includes(current.status) && (
            <Card sx={{ mt: 3 }}><CardContent>
              <Typography variant="h6">投诉</Typography>
              {role === UserRole.CUSTOMER ? (
                relatedComplaint ? (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography>{relatedComplaint.title}</Typography>
                      <StatusBadge value={`complaint:${relatedComplaint.status}`} />
                    </Stack>
                    <Typography color="text.secondary">{relatedComplaint.content}</Typography>
                    {relatedComplaint.handleResult && (
                      <Card variant="outlined" sx={{ mt: 1 }}><CardContent>
                        <Typography variant="subtitle2" color="text.secondary">处理结果</Typography>
                        <Typography>{relatedComplaint.handleResult}</Typography>
                      </CardContent></Card>
                    )}
                    <Typography color="text.secondary" variant="body2">提交时间：{datetime(relatedComplaint.createdAt)}</Typography>
                  </Stack>
                ) : (
                  <Button color="error" variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => setComplaintOpen(true)}>发起投诉</Button>
                )
              ) : relatedComplaint ? (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography>{relatedComplaint.title}</Typography>
                      <StatusBadge value={`complaint:${relatedComplaint.status}`} />
                    </Stack>
                    <Typography color="text.secondary">{relatedComplaint.content}</Typography>
                    {relatedComplaint.handleResult && (
                      <Card variant="outlined"><CardContent>
                        <Typography variant="subtitle2" color="text.secondary">处理结果</Typography>
                        <Typography>{relatedComplaint.handleResult}</Typography>
                      </CardContent></Card>
                    )}
                    <Typography color="text.secondary" variant="body2">提交时间：{datetime(relatedComplaint.createdAt)}</Typography>
                  </Stack>
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 2 }}>暂无投诉记录</Typography>
                )}
            </CardContent></Card>
          )}
        </Grid>
      </Grid>
      <Dialog open={complaintOpen} onClose={() => setComplaintOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>发起投诉</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="投诉标题" fullWidth value={complaintTitle} onChange={(e) => setComplaintTitle(e.target.value)} placeholder="请简要描述问题" />
            <TextField label="投诉内容" fullWidth multiline minRows={5} value={complaintContent} onChange={(e) => setComplaintContent(e.target.value)} placeholder="请详细描述您遇到的问题" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComplaintOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={submitComplaint} disabled={!complaintTitle.trim() || !complaintContent.trim()}>提交投诉</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
