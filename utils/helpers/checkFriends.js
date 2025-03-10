/**
 *
 * @param {UserDocument} targetUser
 * @param {UserDocument} currentUser
 * @param {import("express").NextFunction} next
 * @returns
 */
export const checkFriends = (targetUser, currentUser, next) => {
  //check if he is in target users friend already
  if (targetUser.friend_requests.includes(currentUser._id))
    return next(
      new Error(`you already sent a friend request to ${currentUser.email}`, {
        cause: 400,
      })
    );
  //check if he is in target users friend already
  if (targetUser.friends.includes(currentUser._id))
    return next(
      new Error(`you are already a frind with ${currentUser.email}`, {
        cause: 400,
      })
    );
  //check if target user is in current user's friend requests already
  if (currentUser.friend_requests.includes(targetUser._id))
    return next(
      new Error(`${targetUser.email} already sent you a friend request`, {
        cause: 400,
      })
    );
  //check if target user is in current user's friends already
  if (currentUser.friends.includes(targetUser._id))
    return next(
      new Error(`${targetUser.email} is already a friend with you`, {
        cause: 400,
      })
    );
};
