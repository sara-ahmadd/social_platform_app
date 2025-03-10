/**
 *
 * @param {UserDocument} targetUser
 * @param {UserDocument} currentUser
 * @param {import("express").NextFunction} next
 * @returns
 */
export const checkFriends = (targetUser, currentUser, next) => {
  //check if he is in target users friend already
  if (
    targetUser.friend_requests.map(String).includes(currentUser._id.toString())
  )
    return next(
      new Error(`you already sent a friend request to ${targetUser.email}`, {
        cause: 400,
      })
    );
  //check if he is in target users friend already
  if (targetUser.friends.map(String).includes(currentUser._id.toString()))
    return next(
      new Error(`you are already a frind with ${targetUser.email}`, {
        cause: 400,
      })
    );
  //check if target user is in current user's friend requests already
  if (
    currentUser.friend_requests.map(String).includes(targetUser._id.toString())
  )
    return next(
      new Error(`${targetUser.email} already sent you a friend request`, {
        cause: 400,
      })
    );
  //check if target user is in current user's friends already
  if (currentUser.friends.map(String).includes(targetUser._id.toString()))
    return next(
      new Error(`${targetUser.email} is already a friend with you`, {
        cause: 400,
      })
    );
};
