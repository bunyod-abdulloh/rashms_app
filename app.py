from aiogram import executor
from pytz import timezone

from loader import dp, db
import middlewares, filters, handlers
from utils.apscheduler import scheduler, jobs
from utils.notify_admins import on_startup_notify
from utils.set_bot_commands import set_default_commands


async def on_startup(dispatcher):
    await set_default_commands(dispatcher)
    await on_startup_notify(dispatcher)
    await db.create()
    # await db.drop_table_links()
    # await db.drop_table_users()
    # await db.drop_table_admins()
    await db.create_tables()
    # await db.add_send_status()

    scheduler.add_job(
        jobs,
        'cron',
        hour=23,
        minute=10,
        timezone=timezone('Asia/Tashkent')
    )
    scheduler.start()


if __name__ == '__main__':
    executor.start_polling(dp, on_startup=on_startup, skip_updates=True)
