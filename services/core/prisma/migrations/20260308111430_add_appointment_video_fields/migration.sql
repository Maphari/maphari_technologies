-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "videoCallStatus" TEXT DEFAULT 'NONE',
ADD COLUMN     "videoProvider" TEXT,
ADD COLUMN     "videoRoomUrl" TEXT;
